"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { IconTile } from "@/components/ui/icon-tile";
import { primaryNav, secondaryNav } from "@/lib/nav";
import type { SearchEntry } from "@/lib/search-index";

/**
 * The mobile navigation. It receives the same search index as the desktop bar so
 * a visitor on a phone can still see how much is behind the menu. Categories
 * carry their icon, so the menu matches the index rather than flattening it into
 * a list of words.
 */
export function MobileMenu({ entries }: { entries: SearchEntry[] }) {
  const [open, setOpen] = useState(false);

  // Under Cache Components a route is hidden, not unmounted. Close the panel
  // so returning to a page does not restore an open menu.
  useLayoutEffect(() => {
    return () => setOpen(false);
  }, []);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-md border border-line text-fg transition-colors duration-150 ease-out hover:border-accent/60 hover:bg-surface-2 hover:text-accent"
      >
        {open ? (
          <X className="size-[18px]" aria-hidden="true" />
        ) : (
          <Menu className="size-[18px]" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div
          id="mobile-nav"
          className="sheet-in absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-line bg-surface shadow-lg"
        >
          <nav aria-label="Tools" className="container-page py-5">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <Logo size={26} />
              <span className="text-xs text-muted">{entries.length} tools ready</span>
            </div>

            <p className="pt-5 pb-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
              Categories
            </p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {primaryNav.map((item) => {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-medium text-fg no-underline transition-colors duration-150 ease-out hover:bg-surface-2"
                    >
                      <IconTile icon={item.icon} color={item.color} size="sm" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="pt-6 pb-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
              More
            </p>
            <ul className="grid grid-cols-2 gap-1.5">
              {secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-md px-3 text-[0.9375rem] text-muted no-underline transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
