import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { IconTile } from "@/components/ui/icon-tile";
import { getCategory } from "@/lib/tools/categories";
import type { ToolDefinition } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

/**
 * The compact row used in the places a short list beats a grid — related tools,
 * the 404 page. Rows are separated by a hairline rather than boxed, which keeps
 * a five-item list from reading as five cards.
 */
export function ToolRow({
  tool,
  showCategory = true,
  className,
}: {
  tool: ToolDefinition;
  showCategory?: boolean;
  className?: string;
}) {
  const category = getCategory(tool.category);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group flex min-h-16 items-center gap-3.5 px-4 py-3 no-underline transition-colors duration-150 ease-out hover:bg-surface-2",
        className,
      )}
    >
      <IconTile icon={tool.icon} color={category.color} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-fg">
          {tool.name}
        </span>
        <span className="mt-0.5 block truncate text-xs leading-relaxed text-muted">
          {tool.tagline}
        </span>
      </span>
      {showCategory ? (
        <span className="shrink-0 font-mono text-xs uppercase tracking-[0.1em] text-muted">
          {category.navLabel}
        </span>
      ) : null}
      <ArrowRight
        className="size-4 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-accent"
        aria-hidden="true"
      />
    </Link>
  );
}
