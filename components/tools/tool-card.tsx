import Link from "next/link";

import { getCategory } from "@/lib/tools/categories";
import type { ToolDefinition } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

/**
 * A tool tile. The directory is the product, so a uniform, scannable grid is the
 * right information design here — the restraint is in the surface treatment:
 * hairline border, no shadow, one deliberate hover.
 */
export function ToolCard({
  tool,
  showCategory = false,
  className,
}: {
  tool: ToolDefinition;
  showCategory?: boolean;
  className?: string;
}) {
  const Icon = tool.icon;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "panel card-interactive group flex flex-col gap-3 p-5 no-underline",
        className,
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-accent transition-colors duration-150 ease-out group-hover:border-accent/40">
          <Icon className="size-[19px]" aria-hidden="true" />
        </span>
        {showCategory ? (
          <span className="text-xs text-muted">{getCategory(tool.category).navLabel}</span>
        ) : null}
      </span>
      <span className="font-display text-[1.0625rem] font-bold leading-tight text-fg">
        {tool.name}
      </span>
      <span className="text-sm leading-relaxed text-muted">{tool.tagline}</span>
    </Link>
  );
}

/**
 * A compact row, used where the grid would be too heavy — “Recently added”,
 * related tools and search results.
 */
export function ToolRow({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex min-h-14 items-center gap-3 rounded-md border border-transparent px-3 py-2.5 no-underline transition-colors duration-150 ease-out hover:border-line hover:bg-surface-2"
    >
      <Icon className="size-[18px] shrink-0 text-accent" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">{tool.name}</span>
        <span className="block truncate text-xs text-muted">{tool.tagline}</span>
      </span>
      <span className="shrink-0 text-xs text-muted">{getCategory(tool.category).navLabel}</span>
    </Link>
  );
}
