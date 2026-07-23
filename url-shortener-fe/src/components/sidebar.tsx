"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Link2,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { clearTokens, getUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/shorten", label: t("nav.shorten"), icon: Scissors },
    { href: "/links", label: t("nav.links"), icon: Link2 },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center px-6">
        <BrandLogo />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800 space-y-2">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium">{user?.name || "User"}</p>
          <p className="text-xs text-zinc-500">{user?.email}</p>
        </div>
        <div className="w-full flex justify-start">
          <LanguageSwitcher />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800" 
          onClick={toggleTheme}
        >
          {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {mounted && theme === "dark" ? t("theme.light") : t("theme.dark")}
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </Button>
      </div>
    </aside>
  );
}

export function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
