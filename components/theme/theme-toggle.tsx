"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect } from "react";

import { applyTheme, readAppliedTheme } from "@/components/theme/theme-script";

/**
 * Icon and accessible name are chosen purely in CSS from `[data-theme]`, so the
 * server HTML and the hydrated DOM never disagree and there is nothing to flash.
 * Only the click handler needs JavaScript.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // In development React remounts once and resets <html> attributes, clearing
  // the one the inline script set. Re-apply before paint. No-op in production.
  useLayoutEffect(() => {
    if (!document.documentElement.getAttribute("data-theme")) {
      document.documentElement.setAttribute("data-theme", readAppliedTheme());
    }
  }, []);

  useEffect(() => {
    // Keep the theme in step with the OS only while the user has not chosen.
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem("toolnest-theme")) return;
      } catch {
        return;
      }
      applyTheme(event.matches ? "light" : "dark");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next = readAppliedTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        "inline-flex size-11 items-center justify-center rounded-md border border-line text-fg transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-accent" +
        (className ? ` ${className}` : "")
      }
      title="Switch colour theme"
    >
      {/* Dark mode is active -> offer the light theme. */}
      <Sun className="hidden size-[18px] dark:block" aria-hidden="true" />
      <Moon className="block size-[18px] dark:hidden" aria-hidden="true" />
      <span className="sr-only hidden dark:inline">Switch to the light theme</span>
      <span className="sr-only inline dark:hidden">Switch to the dark theme</span>
    </button>
  );
}
