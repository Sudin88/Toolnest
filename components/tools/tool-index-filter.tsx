"use client";

import { Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { ToolIndex } from "@/components/tools/tool-index";
import type { ToolIndexGroup } from "@/lib/tools/index-view";
import { cn } from "@/lib/utils";

/**
 * The directory plus a live filter, on one sticky bar.
 *
 * Filtering happens on the client because the list is small and the interaction
 * should be instant. The unfiltered index is still rendered on the server, so a
 * search engine or a visitor with no JavaScript sees every tool.
 *
 * The category chips are anchors first and controls second: each one points at
 * its group's `id`, so with no script it simply jumps there, and with script it
 * narrows the list instead. That is why they carry `aria-current` rather than a
 * button's `aria-pressed` — they are links that have been given a second job,
 * not buttons pretending to be links.
 */
export function ToolIndexFilter({
  groups,
  showCategoryFilter = false,
  showGroupHeadings = true,
  headingLevel = "h2",
  className,
}: {
  groups: ToolIndexGroup[];
  showCategoryFilter?: boolean;
  /** Off on a category page, where the page header already names the group. */
  showGroupHeadings?: boolean;
  /** h2 when the index is the page; h3 when a section heading already sits above it. */
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((group) => category === null || group.slug === category)
      .map((group) => ({
        ...group,
        items: q
          ? group.items.filter((item) =>
              `${item.name} ${item.tagline} ${item.categoryLabel}`.toLowerCase().includes(q),
            )
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query, category]);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const shown = filtered.reduce((sum, group) => sum + group.items.length, 0);
  const filtering = query.trim().length > 0 || category !== null;

  function reset() {
    setQuery("");
    setCategory(null);
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="sticky top-16 z-10 -mx-5 border-b border-line bg-canvas/90 px-5 py-3 backdrop-blur-md md:-mx-8 md:px-8 lg:top-[4.5rem]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="search-shell h-11 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                <Search className="size-[18px]" aria-hidden="true" />
              </span>
              <label htmlFor={searchId} className="sr-only">
                Filter tools by name or task
              </label>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Filter ${total} tools by name or task`}
                className="h-full w-full rounded-md bg-transparent pl-11 pr-4 text-[0.9375rem] text-fg outline-none placeholder:text-muted"
              />
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={!filtering}
              className={cn("btn btn-secondary btn-sm shrink-0", !filtering && "invisible")}
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </button>
          </div>

          {showCategoryFilter ? (
            <div role="group" aria-label="Filter by category" className="-mx-1 flex flex-wrap gap-2 px-1">
              <button
                type="button"
                aria-pressed={category === null}
                onClick={() => setCategory(null)}
                className="chip"
              >
                All
                <span className="num">{total}</span>
              </button>
              {groups.map((group) => {
                const selected = category === group.slug;
                return (
                  <a
                    key={group.slug}
                    href={`#category-${group.slug}`}
                    aria-current={selected ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      setCategory(selected ? null : group.slug);
                    }}
                    className="chip"
                  >
                    {group.name}
                    <span className="num">{group.items.length}</span>
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <p role="status" aria-live="polite" className={cn("num pt-4 text-xs text-muted", !filtering && "sr-only")}>
        {filtering ? `${shown} of ${total} tools shown` : ""}
      </p>

      {filtered.length > 0 ? (
        <ToolIndex
          groups={filtered}
          className="pt-4"
          showCategoryTag={false}
          showGroupHeadings={showGroupHeadings}
          headingLevel={headingLevel}
          linkHeadings
          expandAll={filtering}
        />
      ) : (
        <p className="panel-inset mt-4 flex flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted">
          Nothing matches {query.trim() ? `“${query.trim()}”` : "that filter"}.
          <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>
            Clear the filter
          </button>
        </p>
      )}
    </div>
  );
}
