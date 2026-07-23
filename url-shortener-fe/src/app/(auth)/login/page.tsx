"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Script from "next/script";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, saveTokens, saveUser } from "@/lib/api";
import { ThemeDropdown } from "@/components/theme-dropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";

declare global {
  interface Window {
    google: any;
  }
}

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      if (res.data.mfaRequired) {
        setMfaToken(res.data.mfaToken || "");
        setShowMfaInput(true);
        toast.info(t("login.mfaToastInfo"));
        return;
      }
      saveTokens(res.data.accessToken, res.data.refreshToken);
      saveUser({ userId: res.data.userId, email: res.data.email, name: res.data.name });
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  const handleGoogleResponse = async (response: any) => {
    const idToken = response.credential;
    if (!idToken) return;

    try {
      const res = await authApi.googleLogin(idToken);
      if (res.data.mfaRequired) {
        setMfaToken(res.data.mfaToken || "");
        setShowMfaInput(true);
        toast.info(t("login.mfaToastInfo"));
        return;
      }
      saveTokens(res.data.accessToken, res.data.refreshToken);
      saveUser({ userId: res.data.userId, email: res.data.email, name: res.data.name });
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Google authentication failed");
      console.error(error);
    }
  };

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      toast.error("Code must be 6 digits");
      return;
    }

    setIsVerifyingMfa(true);
    try {
      const res = await authApi.verify2Fa({ mfaToken, code: mfaCode });
      saveTokens(res.data.accessToken, res.data.refreshToken);
      saveUser({ userId: res.data.userId, email: res.data.email, name: res.data.name });
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(t("login.mfaToastError"));
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const initializeGoogleSignIn = () => {
    if (typeof window === "undefined" || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "your-google-client-id.apps.googleusercontent.com") {
      console.warn("Google Client ID is not configured in environment variables.");
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      const container = document.getElementById("google-signin-button");
      if (container) {
        window.google.accounts.id.renderButton(
          container,
          { theme: "outline", size: "large", width: 382, text: "continue_with" }
        );
      }
    } catch (err) {
      console.error("Failed to initialize Google Sign-In:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      initializeGoogleSignIn();
    }
  }, [showMfaInput]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Header / Navbar */}
      <header className="w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeDropdown />
            <Button variant="ghost" asChild className="text-xs sm:text-sm">
              <Link href="/">{t("nav.backHome")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Card Centered */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {showMfaInput ? t("login.mfaTitle") : t("login.title")}
            </CardTitle>
            <CardDescription>
              {showMfaInput ? t("login.mfaDesc") : t("login.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showMfaInput ? (
              <div className="space-y-4">
                <form onSubmit={onMfaSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode">{t("login.mfaLabel")}</Label>
                    <Input
                      key="mfa-code-input"
                      id="mfaCode"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isVerifyingMfa}>
                    {isVerifyingMfa ? t("login.mfaVerifying") : t("login.mfaVerifyBtn")}
                  </Button>
                </form>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowMfaInput(false);
                    setMfaToken("");
                    setMfaCode("");
                  }}
                >
                  {t("login.mfaBackBtn")}
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("login.emailLabel")}</Label>
                    <Input key="email-input" id="email" type="email" placeholder="you@example.com" {...register("email")} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("login.passwordLabel")}</Label>
                    <Input key="password-input" id="password" type="password" {...register("password")} />
                    {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t("login.signingIn") : t("login.signInBtn")}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950">{t("login.orContinue")}</span>
                  </div>
                </div>

                <div className="flex justify-center w-full min-h-[44px]">
                  <div id="google-signin-button" className="w-full flex justify-center" />
                </div>

                <p className="mt-4 text-center text-sm text-zinc-500">
                  {t("login.noAccount")}{" "}
                  <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-50">
                    {t("login.registerLink")}
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {!showMfaInput && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initializeGoogleSignIn}
        />
      )}
    </div>
  );
}
