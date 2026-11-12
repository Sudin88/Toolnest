"use client";

import { ChevronDown, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import type { ToolIndexGroup, ToolIndexItem } from "@/lib/tools/index-view";
import { toggleFavourite, useFavouriteSlugs } from "@/lib/favourites";
import { cn } from "@/lib/utils";

/**
 * The directory, drawn as a numbered index rather than a card grid: a ruler, a
 * number, the name, a one-line tagline, and a star.
 *
 * Two facts are deliberately *not* repeated on every row. The category tag is
 * shown only where the group heading is absent (search results, recents, the
 * favourites strip); and “runs on your device” is stated once on the page, with
 * a marker kept only for a tool that is *not* local. A promise printed on every
 * line carries no information.
 *
 * Each group collapses to its first few rows behind a native `<details>`, so the
 * overflow is still in the HTML for search engines and still openable with no
 * JavaScript; when a filter or a search is narrowing the list, the caller passes
 * `expandAll` and every match is shown at once.
 */

function StarButton({ item }: { item: ToolIndexItem }) {
  const favourites = useFavouriteSlugs();
  const active = favourites.includes(item.slug);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
      title={active ? "Remove from favourites" : "Add to favourites"}
      onClick={() => toggleFavourite(item.slug)}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-md transition-colors duration-150 ease-out",
        active ? "text-accent" : "text-muted hover:text-accent",
      )}
    >
      <Star className={cn("size-4", active && "fill-current")} aria-hidden="true" />
    </button>
  );
}

/**
 * One row. Memoised so a keystroke in the filter — which rebuilds the group
 * objects around it — does not re-render the rows that did not change.
 */
const IndexRow = memo(function IndexRow({
  item,
  number,
  showCategoryTag,
}: {
  item: ToolIndexItem;
  number: number;
  showCategoryTag: boolean;
}) {
  return (
    <li className="group flex items-stretch border-b border-line">
      <Link
        href={`/tools/${item.slug}`}
        className="grid min-h-14 flex-1 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-2 py-3.5 no-underline transition-colors duration-150 ease-out hover:bg-surface-2 focus-visible:bg-surface-2"
      >
        <span className="num self-start pt-0.5 text-xs text-muted">{String(number).padStart(2, "0")}</span>

        <span className="min-w-0">
          <span className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-fg">
            {item.name}
          </span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">{item.tagline}</span>
        </span>

        <span className="flex items-center justify-end gap-3 self-start pt-0.5">
          {!item.local ? (
            <span className="chip">
              <ShieldCheck className="size-3.5 text-highlight" aria-hidden="true" />
              Server
            </span>
          ) : null}
          {showCategoryTag ? <span className="chip">{item.categoryLabel}</span> : null}
          {/* A quiet hint for pointer users. It is decorative: the row is a link,
              so nothing here is required to open the tool. */}
          <span
            aria-hidden="true"
            className="hidden text-xs text-muted opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100 lg:inline"
          >
            Open
          </span>
        </span>
      </Link>
      <span className="flex items-center pr-1">
        <StarButton item={item} />
      </span>
    </li>
  );
});

export function ToolIndex({
  groups,
  startAt = 1,
  showCategoryTag = true,
  showGroupHeadings = true,
  linkHeadings = false,
  headingLevel = "h3",
  collapsedRows = 5,
  expandAll = false,
  className,
}: {
  groups: ToolIndexGroup[];
  /** First number in the index. The catalogue counts from one. */
  startAt?: number;
  showCategoryTag?: boolean;
  showGroupHeadings?: boolean;
  /** Link each group heading to its category page. */
  linkHeadings?: boolean;
  /** h3 under the homepage's section h2; h2 when the index is the whole page. */
  headingLevel?: "h2" | "h3";
  /** Rows shown before a group collapses the rest. */
  collapsedRows?: number;
  /** Show every row at once — used while filtering, so matches are never hidden. */
  expandAll?: boolean;
  className?: string;
}) {
  let counter = startAt;

  return (
    <div className={cn("flex flex-col gap-12", className)}>
      {groups.map((group) => {
        const headingContent = linkHeadings ? (
          <Link href={`/categories/${group.slug}`} className="no-underline hover:text-accent-text">
            {group.name}
          </Link>
        ) : (
          group.name
        );
        const headingClassName = "text-2xl font-bold leading-tight tracking-[-0.02em] text-fg";

        const visible = expandAll ? group.items : group.items.slice(0, collapsedRows);
        const overflow = expandAll ? [] : group.items.slice(collapsedRows);
        const overflowStart = counter + visible.length;

        return (
          <section
            key={group.slug}
            id={`category-${group.slug}`}
            aria-labelledby={showGroupHeadings ? `index-${group.slug}` : undefined}
          >
            {showGroupHeadings ? (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3">
                {headingLevel === "h2" ? (
                  <h2 id={`index-${group.slug}`} className={headingClassName}>
                    {headingContent}
                  </h2>
                ) : (
                  <h3 id={`index-${group.slug}`} className={headingClassName}>
                    {headingContent}
                  </h3>
                )}
                <span className="num text-xs text-muted">
                  {group.items.length} {group.items.length === 1 ? "tool" : "tools"}
                </span>
              </div>
            ) : null}

            <ol className={cn(showGroupHeadings ? "border-t border-line-strong" : "border-t border-line")}>
              {visible.map((item) => (
                <IndexRow
                  key={item.slug}
                  item={item}
                  number={counter++}
                  showCategoryTag={showCategoryTag}
                />
              ))}
            </ol>

            {overflow.length > 0 ? (
              <details className="index-overflow">
                <summary className="index-overflow-summary">
                  <ChevronDown className="index-overflow-chevron size-4" aria-hidden="true" />
                  Show all {group.items.length}
                </summary>
                <ol start={overflowStart} className="border-t border-line">
                  {overflow.map((item) => (
                    <IndexRow
                      key={item.slug}
                      item={item}
                      number={counter++}
                      showCategoryTag={showCategoryTag}
                    />
                  ))}
                </ol>
              </details>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
