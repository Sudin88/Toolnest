"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import type { SearchEntry } from "@/lib/search-index";
import { primaryNav, secondaryNav } from "@/lib/site";

/**
 * The mobile navigation. It receives the same search index as the desktop bar so
 * a visitor on a phone can still search without the search bar being visible.
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
        className="inline-flex size-11 items-center justify-center rounded-md border border-line text-fg transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-accent"
      >
        {open ? <X className="size-[18px]" aria-hidden="true" /> : <Menu className="size-[18px]" aria-hidden="true" />}
      </button>

      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-lg"
        >
          <nav aria-label="Tools" className="container-page py-5">
            <div className="flex items-center justify-between pb-4">
              <Logo size={24} />
              <span className="text-xs text-muted">{entries.length} tools ready</span>
            </div>

            <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Categories</p>
            <ul className="grid grid-cols-2 gap-1 pb-5">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] font-medium text-fg no-underline hover:bg-surface-2"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted">More</p>
            <ul className="grid grid-cols-2 gap-1">
              {secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] text-muted no-underline hover:bg-surface-2 hover:text-fg"
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
