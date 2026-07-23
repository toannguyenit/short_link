"use client";

import { useEffect, useState, useRef } from "react";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  const getThemeIcon = (t: string | undefined) => {
    switch (t) {
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "light":
        return <Sun className="h-4 w-4" />;
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (t: string | undefined) => {
    switch (t) {
      case "dark":
        return "Dark";
      case "light":
        return "Light";
      default:
        return "System";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 cursor-pointer"
      >
        {getThemeIcon(theme)}
        <span className="hidden sm:inline text-xs">{getThemeLabel(theme)}</span>
        <ChevronDown className="h-3 w-3 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Laptop className="h-3.5 w-3.5 text-zinc-500" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
}
