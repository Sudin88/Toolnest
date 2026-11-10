"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { SearchEntry } from "@/lib/search-index";
import { rankEntries } from "@/lib/search-rank";
import { cn } from "@/lib/utils";

const SUGGESTIONS = 6;

/**
 * The hero search. A combobox with an inline suggestion list: typing filters,
 * arrows move, Enter opens the highlighted tool.
 */
export function HeroSearch({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => rankEntries(entries, query, SUGGESTIONS), [entries, query]);
  const showList = focused && query.trim().length > 0;

  function go(slug: string) {
    setFocused(false);
    router.push(`/tools/${slug}`);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = results[active] ?? results[0];
    if (target) go(target.slug);
    else router.push("/tools");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === "Escape") {
      setFocused(false);
    }
  }

  return (
    <div className="relative">
      <form onSubmit={onSubmit} role="search" className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[19px] -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls="hero-search-results"
            aria-autocomplete="list"
            aria-activedescendant={
              showList && results[active] ? `hero-option-${results[active].slug}` : undefined
            }
            aria-label="Search tools"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            placeholder="Search 35 tools — try “merge pdf” or “compress image”"
            className="field h-14 pl-11 text-base shadow-sm"
          />
        </div>
        <button type="submit" className="btn btn-primary h-14 px-5">
          Search
        </button>
      </form>

      {showList ? (
        <ul
          id="hero-search-results"
          role="listbox"
          aria-label="Tool suggestions"
          className="panel absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-80 overflow-y-auto p-2 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted">
              Nothing matches “{query}”.{" "}
              <Link
                href="/tools"
                className="link"
                onMouseDown={(event) => event.preventDefault()}
              >
                Browse all tools
              </Link>
              .
            </li>
          ) : (
            results.map((entry, index) => (
              <li key={entry.slug} role="none">
                <Link
                  id={`hero-option-${entry.slug}`}
                  role="option"
                  aria-selected={index === active}
                  href={`/tools/${entry.slug}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 no-underline",
                    index === active ? "bg-surface-2" : "",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{entry.name}</span>
                    <span className="block truncate text-xs text-muted">{entry.tagline}</span>
                  </span>
                  <span className="shrink-0 text-[0.6875rem] text-muted">{entry.group}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
