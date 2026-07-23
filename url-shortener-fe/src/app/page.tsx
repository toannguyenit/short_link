"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Scissors, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  Check, 
  Zap 
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getUser } from "@/lib/api";
import { ThemeDropdown } from "@/components/theme-dropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";

export default function HomePage() {
  const { t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [longUrl, setLongUrl] = useState("");
  const [mockResult, setMockResult] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getUser());
  }, []);

  const handleMockShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl.trim()) return;

    // Generate random short code
    const randomCode = Math.random().toString(36).substring(2, 8);

    // Save mapping to localStorage for dynamic redirection
    let targetUrl = longUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const stored = localStorage.getItem("mock_links");
    let mappings: Record<string, string> = {};
    if (stored) {
      try {
        mappings = JSON.parse(stored);
      } catch (err) {}
    }
    mappings[randomCode] = targetUrl;
    localStorage.setItem("mock_links", JSON.stringify(mappings));

    // Resolve domain dynamically (localhost or production domain)
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    setMockResult(`${base}/${randomCode}`);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!mockResult) return;
    navigator.clipboard.writeText(mockResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <BrandLogo />
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                {t("nav.features")}
              </a>
              <a href="#demo" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                {t("nav.demo")}
              </a>
              <a href="#stats" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                {t("nav.analytics")}
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeDropdown />
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/dashboard">
                  {t("nav.dashboard")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">{t("nav.signIn")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{t("nav.getStarted")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-20">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/5" />
        <div className="absolute top-1/3 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
              <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> {t("landing.heroBadge")}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-50 bg-clip-text text-transparent">
              {t("landing.heroTitle")}<br />{t("landing.heroTitle2")}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              {t("landing.heroDesc")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              {isLoggedIn ? (
                <Button size="lg" asChild className="px-8 py-6 text-base font-semibold">
                  <Link href="/dashboard">
                    {t("landing.goDashboardBtn")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="px-8 py-6 text-base font-semibold">
                    <Link href="/register">{t("landing.getStartedBtn")}</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="px-8 py-6 text-base font-semibold">
                    <Link href="/login">{t("nav.signIn")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="overflow-hidden border border-zinc-200/80 bg-white/50 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/50 shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{t("landing.demoTitle")}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("landing.demoDesc")}</p>
              </div>

              <form onSubmit={handleMockShorten} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="url"
                  placeholder={t("landing.demoInputPlaceholder")}
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  required
                />
                <Button type="submit" className="sm:w-36 font-semibold py-3 cursor-pointer">
                  {t("landing.demoBtn")}
                </Button>
              </form>

              {mockResult && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Check className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">{t("landing.demoSuccess")}</p>
                      <span className="font-mono text-sm font-semibold select-all text-zinc-900 dark:text-zinc-50">{mockResult}</span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopy}
                    className="w-full sm:w-auto gap-2 bg-white dark:bg-zinc-900 border-emerald-200 hover:bg-emerald-100 dark:border-emerald-900 dark:hover:bg-emerald-950/50 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" /> {t("landing.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> {t("landing.copyBtn")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("landing.featuresTitle")}</h2>
            <p className="text-zinc-500 dark:text-zinc-400">{t("landing.featuresDesc")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 pt-6">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-8 text-left transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-6 inline-block rounded-xl bg-indigo-50 p-3 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <Scissors className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{t("landing.feature1Title")}</h3>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {t("landing.feature1Desc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-8 text-left transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-6 inline-block rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{t("landing.feature2Title")}</h3>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {t("landing.feature2Desc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-8 text-left transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-6 inline-block rounded-xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{t("landing.feature3Title")}</h3>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {t("landing.feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="bg-zinc-900 py-16 text-white dark:bg-zinc-900/50 dark:border-t dark:border-b dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-10 gap-x-8 md:grid-cols-4 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-white sm:text-5xl">10M+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("landing.statsLinks")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-white sm:text-5xl">500M+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("landing.statsClicks")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-white sm:text-5xl">99.99%</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("landing.statsUptime")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-extrabold text-white sm:text-5xl">&lt;50ms</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("landing.statsLatency")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-20">
            {/* Glowing pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),transparent_50%)]" />
            <div className="relative space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t("landing.ctaTitle")}
              </h2>
              <p className="text-zinc-400 text-base max-w-lg mx-auto">
                {t("landing.ctaDesc")}
              </p>
              <div className="pt-4">
                <Button size="lg" asChild className="px-8 py-6 font-semibold bg-white text-zinc-950 hover:bg-zinc-100 cursor-pointer">
                  <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                    {isLoggedIn ? t("landing.goDashboardBtn") : t("landing.ctaBtn")} <ArrowRight className="ml-2 h-5 w-5 text-zinc-950" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-zinc-500 dark:text-zinc-400 text-sm">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span>&copy; {new Date().getFullYear()} ShortLink. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50">Terms of Service</a>
            <a href="mailto:support@shortlink.io" className="hover:text-zinc-900 dark:hover:text-zinc-50">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
