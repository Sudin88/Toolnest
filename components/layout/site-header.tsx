import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { ToolSearch } from "@/components/navigation/tool-search";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buildSearchIndex } from "@/lib/search-index";
import { primaryNav } from "@/lib/site";

export function SiteHeader() {
  const searchIndex = buildSearchIndex();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="container-page grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="rounded-sm no-underline" aria-label="ToolNest home">
          <Logo />
        </Link>

        <nav aria-label="Tool categories" className="hidden justify-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted no-underline transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/tools"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted no-underline transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg"
          >
            All tools
          </Link>
        </nav>

        <div className="col-start-3 flex items-center justify-end gap-2">
          <ToolSearch entries={searchIndex} />
          <ThemeToggle />
          <MobileMenu entries={searchIndex} />
        </div>
      </div>
    </header>
  );
}
