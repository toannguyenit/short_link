package com.urlshortener.auth.service;

import com.urlshortener.auth.dto.*;
import com.urlshortener.auth.entity.User;
import com.urlshortener.auth.repository.UserRepository;
import com.urlshortener.common.exception.ConflictException;
import com.urlshortener.common.exception.ResourceNotFoundException;
import com.urlshortener.common.exception.UnauthorizedException;
import com.urlshortener.common.security.JwtService;
import com.urlshortener.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorConfig;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator(
            new GoogleAuthenticatorConfig.GoogleAuthenticatorConfigBuilder()
                    .setWindowSize(1) // Strict mode: zero clock drift tolerance (only current code is valid)
                    .build()
    );

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.isMfaEnabled()) {
            return AuthResponse.builder()
                    .mfaRequired(true)
                    .mfaToken(jwtService.generateMfaToken(user.getId(), user.getEmail()))
                    .build();
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
        try {
            Map<?, ?> tokenInfo = restTemplate.getForObject(url, Map.class);
            if (tokenInfo == null || tokenInfo.containsKey("error_description")) {
                throw new UnauthorizedException("Invalid Google token");
            }

            String aud = (String) tokenInfo.get("aud");
            if (googleClientId != null && !googleClientId.trim().isEmpty() && !googleClientId.equals(aud)) {
                throw new UnauthorizedException("Google token audience mismatch");
            }

            String email = (String) tokenInfo.get("email");
            String name = (String) tokenInfo.get("name");
            String sub = (String) tokenInfo.get("sub");

            if (email == null) {
                throw new UnauthorizedException("Google token does not contain email");
            }

            User user = userRepository.findByEmail(email)
                    .map(existingUser -> {
                        if (existingUser.getGoogleId() == null) {
                            existingUser.setGoogleId(sub);
                            existingUser.setAuthProvider("GOOGLE");
                            return userRepository.save(existingUser);
                        }
                        return existingUser;
                    })
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .id(UUID.randomUUID())
                                .email(email)
                                .name(name != null ? name : email.split("@")[0])
                                .authProvider("GOOGLE")
                                .googleId(sub)
                                .build();
                        return userRepository.save(newUser);
                    });

            if (user.isMfaEnabled()) {
                return AuthResponse.builder()
                        .mfaRequired(true)
                        .mfaToken(jwtService.generateMfaToken(user.getId(), user.getEmail()))
                        .build();
            }

            return buildAuthResponse(user);
        } catch (Exception e) {
            throw new UnauthorizedException("Google login failed: " + e.getMessage());
        }
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        try {
            if (!jwtService.isRefreshToken(request.getRefreshToken())) {
                throw new UnauthorizedException("Invalid refresh token");
            }
            UUID userId = jwtService.getUserId(request.getRefreshToken());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
            return buildAuthResponse(user);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid refresh token");
        }
    }

    public UserResponse getMe(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .mfaEnabled(user.isMfaEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public MfaSetupResponse setupMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GoogleAuthenticatorKey key = gAuth.createCredentials();

        user.setMfaSecret(key.getKey());
        userRepository.save(user);

        String qrCodeUrl = "otpauth://totp/ShortLink:" + user.getEmail() + "?secret=" + key.getKey() + "&issuer=ShortLink";

        return MfaSetupResponse.builder()
                .secret(key.getKey())
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    public void enableMfa(UUID userId, MfaCodeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getMfaSecret() == null) {
            throw new BadRequestException("MFA is not set up");
        }

        boolean isValid = gAuth.authorize(user.getMfaSecret(), Integer.parseInt(request.getCode()));
        if (!isValid) {
            int expected = gAuth.getTotpPassword(user.getMfaSecret());
            log.error("MFA enable verification failed. Received: {}, Expected: {}, Secret: {}", 
                    request.getCode(), expected, user.getMfaSecret());
            throw new UnauthorizedException("Invalid verification code");
        }

        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    public void disableMfa(UUID userId, MfaCodeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isMfaEnabled()) {
            throw new BadRequestException("MFA is already disabled");
        }

        boolean isValid = gAuth.authorize(user.getMfaSecret(), Integer.parseInt(request.getCode()));
        if (!isValid) {
            throw new UnauthorizedException("Invalid verification code");
        }

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }

    public AuthResponse verifyMfaLogin(MfaVerifyRequest request) {
        try {
            if (!jwtService.isMfaToken(request.getMfaToken())) {
                throw new UnauthorizedException("Invalid MFA token");
            }

            UUID userId = jwtService.getUserId(request.getMfaToken());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));

            if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
                throw new BadRequestException("MFA is not enabled for this user");
            }

            boolean isValid = gAuth.authorize(user.getMfaSecret(), Integer.parseInt(request.getCode()));
            if (!isValid) {
                int expected = gAuth.getTotpPassword(user.getMfaSecret());
                log.error("MFA login verification failed. Received: {}, Expected: {}, Secret: {}", 
                        request.getCode(), expected, user.getMfaSecret());
                throw new UnauthorizedException("Invalid verification code");
            }

            return buildAuthResponse(user);
        } catch (Exception e) {
            if (e instanceof BadRequestException || e instanceof UnauthorizedException) {
                throw e;
            }
            throw new UnauthorizedException("MFA verification failed: " + e.getMessage());
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .accessToken(jwtService.generateAccessToken(user.getId(), user.getEmail()))
                .refreshToken(jwtService.generateRefreshToken(user.getId(), user.getEmail()))
                .build();
    }
}
