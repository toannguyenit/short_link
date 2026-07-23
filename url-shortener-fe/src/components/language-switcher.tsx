"use client";

import { useI18n, Locale } from "./i18n-provider";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLanguageLabel = (loc: Locale) => {
    switch (loc) {
      case "vi":
        return "Tiếng Việt";
      case "en":
      default:
        return "English";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 cursor-pointer"
      >
        <Globe className="h-4 w-4 text-zinc-500" />
        <span className="hidden sm:inline text-xs">{getLanguageLabel(locale)}</span>
        <ChevronDown className="h-3 w-3 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
          <button
            type="button"
            onClick={() => {
              setLocale("en");
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <span>English</span>
            {locale === "en" && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setLocale("vi");
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <span>Tiếng Việt</span>
            {locale === "vi" && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
