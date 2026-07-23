package com.urlshortener.auth.controller;

import com.urlshortener.auth.dto.*;
import com.urlshortener.auth.service.AuthService;
import com.urlshortener.common.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @PostMapping("/2fa/setup")
    @Operation(summary = "Setup 2FA")
    public ResponseEntity<MfaSetupResponse> setupMfa(@RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(authService.setupMfa(userId));
    }

    @PostMapping("/2fa/enable")
    @Operation(summary = "Enable 2FA")
    public ResponseEntity<Void> enableMfa(@RequestHeader("X-User-Id") UUID userId, @Valid @RequestBody MfaCodeRequest request) {
        authService.enableMfa(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/2fa/disable")
    @Operation(summary = "Disable 2FA")
    public ResponseEntity<Void> disableMfa(@RequestHeader("X-User-Id") UUID userId, @Valid @RequestBody MfaCodeRequest request) {
        authService.disableMfa(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/2fa/verify")
    @Operation(summary = "Verify 2FA code during login")
    public ResponseEntity<AuthResponse> verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyMfaLogin(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserResponse> me(@RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(authService.getMe(userId));
    }
}
