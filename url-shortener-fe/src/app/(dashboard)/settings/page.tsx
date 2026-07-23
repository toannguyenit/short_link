"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { useI18n } from "@/components/i18n-provider";

export default function SettingsPage() {
  const { t } = useI18n();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await authApi.me();
      setMfaEnabled(res.data.mfaEnabled);
    } catch (err) {
      toast.error("Failed to load settings profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSetupMfa = async () => {
    setSubmitting(true);
    try {
      const res = await authApi.setup2Fa();
      setSetupData(res.data);
      toast.info("2FA secret generated. Please scan the QR code.");
    } catch (err) {
      toast.error("Failed to set up 2FA");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error("Verification code must be 6 digits");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.enable2Fa(verificationCode);
      toast.success("Two-Factor Authentication enabled successfully!");
      setMfaEnabled(true);
      setSetupData(null);
      setVerificationCode("");
    } catch (err) {
      toast.error("Invalid verification code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error("Verification code must be 6 digits");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.disable2Fa(verificationCode);
      toast.success("Two-Factor Authentication disabled successfully.");
      setMfaEnabled(false);
      setVerificationCode("");
    } catch (err) {
      toast.error("Invalid verification code");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-zinc-500">{t("settings.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${mfaEnabled ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
              {mfaEnabled ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle>{t("settings.mfaTitle")}</CardTitle>
              <CardDescription>
                {t("settings.mfaDesc")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mfaEnabled ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t("settings.mfaActive")}
                </p>
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  {t("settings.mfaActiveDesc")}
                </p>
              </div>

              <form onSubmit={handleDisableMfa} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="disableCode">{t("settings.mfaEnterToDisable")}</Label>
                  <div className="flex max-w-xs gap-2">
                    <Input
                      id="disableCode"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    />
                    <Button type="submit" variant="destructive" disabled={submitting}>
                      {submitting ? t("settings.mfaDisabling") : t("settings.mfaDisableBtn")}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {!setupData ? (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-500">
                    {t("settings.mfaNotEnabledDesc")}
                  </p>
                  <Button onClick={handleSetupMfa} disabled={submitting}>
                    {submitting ? t("settings.mfaGenerating") : t("settings.mfaEnableBtn")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center">
                        <QRCodeSVG value={setupData.qrCodeUrl} size={180} bgColor="#ffffff" fgColor="#000000" />
                      </div>
                      <p className="mt-4 text-xs font-mono text-zinc-500 text-center select-all">
                        {t("settings.mfaSecretKey")}: {setupData.secret}
                      </p>
                    </div>
                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{t("settings.mfaScanTitle")}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {t("settings.mfaScanDesc")}
                        </p>
                      </div>
                      <form onSubmit={handleEnableMfa} className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{t("settings.mfaVerifyTitle")}</h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {t("settings.mfaVerifyDesc")}
                          </p>
                          <Input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                            className="max-w-xs font-mono"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={submitting} className="flex-1 max-w-xs">
                            {submitting ? t("settings.mfaEnabling") : t("settings.mfaVerifyEnableBtn")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setSetupData(null);
                              setVerificationCode("");
                            }}
                          >
                            {t("settings.mfaCancelBtn")}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
