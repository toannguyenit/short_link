"use client";

import * as React from "react";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

// Map of translations. Adding a new language is as simple as adding its JSON import here!
const translations = { en, vi } as const;

export type Locale = keyof typeof translations;

interface I18nContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = React.createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  // Load locale preference from localStorage on mount
  React.useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale && translations[savedLocale]) {
      setLocaleState(savedLocale);
    } else {
      // Fallback to browser preferred language
      const browserLang = navigator.language.split("-")[0] as Locale;
      if (browserLang && translations[browserLang]) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  // Translation helper function supporting nested paths (e.g., "landing.heroTitle")
  const t = (key: string): string => {
    const keys = key.split(".");
    let current: any = translations[locale];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English if translation is missing in selected language
        let fallback: any = translations["en"];
        for (const fk of keys) {
          if (fallback && typeof fallback === "object" && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // return key name if completely missing
          }
        }
        return typeof fallback === "string" ? fallback : key;
      }
    }

    return typeof current === "string" ? current : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
