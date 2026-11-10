import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ToolSearch } from "@/components/navigation/tool-search";
import { buildSearchIndex } from "@/lib/search-index";
import { primaryNav } from "@/lib/site";

/**
 * The header carries brand, destination and search, in that order of weight.
 * It is compact by design: one row at every width, with the search field
 * widening from an icon to a full field once the nav has the room for it.
 */
export function SiteHeader() {
  const searchIndex = buildSearchIndex();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="container-page grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 lg:h-[4.5rem]">
        <Link
          href="/"
          className="rounded-sm no-underline transition-opacity duration-150 ease-out hover:opacity-90"
          aria-label="ToolNest home"
        >
          <Logo size={30} />
        </Link>

        <nav aria-label="Tool categories" className="hidden justify-center gap-0.5 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-[0.9375rem] font-medium text-muted no-underline transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/tools"
            className="ml-1 inline-flex items-center rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-accent-text no-underline transition-colors duration-150 ease-out hover:bg-accent/10"
          >
            All tools
          </Link>
        </nav>

        <div className="col-start-3 flex items-center justify-end gap-2">
          <ToolSearch entries={searchIndex} />
          <MobileMenu entries={searchIndex} />
        </div>
      </div>
    </header>
  );
}
