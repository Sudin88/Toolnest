"use client";

import { CornerDownLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { SearchEntry } from "@/lib/search-index";
import { rankEntries } from "@/lib/search-rank";
import { useRecentSlugs } from "@/lib/recents";
import { useFavouriteSlugs } from "@/lib/favourites";
import { categories } from "@/lib/tools/categories";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 8;
const MAX_CATEGORIES = 3;
const MAX_STARTER = 4;

const subscribeToPlatform = () => () => {};

/** Reads the platform on the client only, with no effect and no hydration gap. */
function useIsMac() {
  return useSyncExternalStore(
    subscribeToPlatform,
    () => /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}

/**
 * True when the event target is somewhere a visitor is already typing, so the
 * global `/` shortcut never hijacks a real input.
 */
function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable;
}

/** One row in the palette: a tool, or a category the query names. */
interface PaletteItem {
  id: string;
  href: string;
  name: string;
  tagline: string;
  tag: string;
}

interface PaletteGroup {
  label: string;
  items: PaletteItem[];
}

function toolItem(entry: SearchEntry): PaletteItem {
  return {
    id: `tool-search-option-${entry.slug}`,
    href: `/tools/${entry.slug}`,
    name: entry.name,
    tagline: entry.tagline,
    tag: entry.group,
  };
}

function categoryItem(category: (typeof categories)[number]): PaletteItem {
  return {
    id: `tool-search-category-${category.slug}`,
    href: `/categories/${category.slug}`,
    name: category.name,
    tagline: category.tagline,
    tag: "Category",
  };
}

/**
 * A value that lags behind by `delay` ms, so a fast typist causes one ranking
 * pass rather than one per keystroke. An empty value is never deferred, so
 * opening the palette shows its starting list at once instead of the previous
 * query's results for one tick.
 */
function useDebounced(value: string, delay: number): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return value === "" ? "" : settled;
}

/**
 * One option row. Memoised because a keystroke changes the list but leaves most
 * rows identical — only the highlighted one takes a new `active` prop.
 */
const PaletteRow = memo(function PaletteRow({
  item,
  index,
  active,
  onSelect,
  onHover,
}: {
  item: PaletteItem;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover: (index: number) => void;
}) {
  return (
    <Link
      id={item.id}
      role="option"
      aria-selected={active}
      href={item.href}
      onClick={onSelect}
      onMouseEnter={() => onHover(index)}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 no-underline",
        active ? "bg-surface-2 text-fg" : "text-fg",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{item.name}</span>
        <span className="block truncate text-xs text-muted">{item.tagline}</span>
      </span>
      <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-muted">
        {item.tag}
      </span>
      {active ? (
        <CornerDownLeft className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
      ) : null}
    </Link>
  );
});

export function ToolSearch({ entries }: { entries: SearchEntry[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // Ranking runs on the settled query, not the live one, so holding down a key
  // does not start a ranking pass per character.
  const debouncedQuery = useDebounced(query, 120);
  const shortcutLabel = useIsMac() ? "⌘K" : "Ctrl K";
  const recentSlugs = useRecentSlugs();
  const favouriteSlugs = useFavouriteSlugs();

  // An empty palette is a starting point, not a blank: what you opened last,
  // then what you starred, then the most popular tools, then the categories. A
  // query searches tools and categories together.
  const groups = useMemo<PaletteGroup[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();

    if (!q) {
      const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
      const resolve = (slugs: string[], limit: number) =>
        slugs
          .map((slug) => bySlug.get(slug))
          .filter((entry): entry is SearchEntry => Boolean(entry))
          .slice(0, limit)
          .map(toolItem);

      const recent = resolve(recentSlugs, MAX_STARTER);
      const recentSet = new Set(recent.map((item) => item.href));
      const favourites = resolve(favouriteSlugs, MAX_STARTER).filter(
        (item) => !recentSet.has(item.href),
      );
      const shown = new Set([...recent, ...favourites].map((item) => item.href));
      const popular = entries
        .filter((entry) => !shown.has(`/tools/${entry.slug}`))
        .slice(0, MAX_STARTER)
        .map(toolItem);

      return [
        ...(recent.length > 0 ? [{ label: "Recent", items: recent }] : []),
        ...(favourites.length > 0 ? [{ label: "Favourites", items: favourites }] : []),
        ...(popular.length > 0 ? [{ label: "Popular", items: popular }] : []),
        { label: "Categories", items: categories.map(categoryItem) },
      ];
    }

    const tools = rankEntries(entries, debouncedQuery, MAX_RESULTS).map(toolItem);
    const matchedCategories = categories
      .filter(
        (category) =>
          category.name.toLowerCase().includes(q) || category.navLabel.toLowerCase().includes(q),
      )
      .slice(0, MAX_CATEGORIES)
      .map(categoryItem);

    return [{ label: "Results", items: [...tools, ...matchedCategories] }];
  }, [debouncedQuery, entries, recentSlugs, favouriteSlugs]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  /** Stable so a hovering pointer does not defeat the row memo. */
  const handleHover = useCallback((index: number) => setActive(index), []);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    // Reset the highlight alongside the query rather than in an effect keyed on
    // it: the two always change together.
    setActive(0);
    dialog.showModal();
    // Focus lands in the field, which is the only thing a visitor wants to use.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Cmd/Ctrl+K opens search from anywhere, matching what people expect. A bare
  // `/` does the same, unless the visitor is already typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isTypingTarget(event.target)) return;
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Under Cache Components, a route is hidden rather than unmounted when the
  // visitor navigates away. Close the dialog so it cannot reappear on the way back.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    const id = flat[active]?.id;
    if (id) document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }, [active, flat]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (flat.length ? (index + 1) % flat.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (flat.length ? (index - 1 + flat.length) % flat.length : 0));
    } else if (event.key === "Enter") {
      const target = flat[active];
      if (target) {
        event.preventDefault();
        close();
        router.push(target.href);
      }
    }
  }

  let optionIndex = -1;

  return (
    <>
      {/* Full field once the nav has the width for it, an icon button below that. */}
      <button
        type="button"
        onClick={open}
        className="group hidden h-10 w-72 items-center gap-2.5 rounded-md border border-line-strong bg-surface-2 px-3 text-left text-sm text-muted transition-colors duration-150 ease-out hover:border-accent hover:text-fg xl:flex"
      >
        <Search className="size-[17px] shrink-0 text-accent-text" aria-hidden="true" />
        <span className="flex-1 truncate">Search tools</span>
        <kbd className="kbd shrink-0">{shortcutLabel}</kbd>
      </button>

      <button
        type="button"
        onClick={open}
        aria-label="Search tools"
        className="inline-flex size-10 items-center justify-center rounded-md border border-line text-fg transition-colors duration-150 ease-out hover:border-accent/60 hover:bg-surface-2 hover:text-accent xl:hidden"
      >
        <Search className="size-[18px]" aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="Search tools"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-[18px] shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search tools and categories…"
            aria-label="Search tools and categories"
            aria-controls="tool-search-results"
            aria-activedescendant={flat[active]?.id}
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted"
          />
        </div>

        <div
          id="tool-search-results"
          role="listbox"
          aria-label="Search results"
          className="scroll-region max-h-[min(24rem,60dvh)] p-2"
        >
          {flat.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Nothing matches “{query}”.{" "}
              <Link href="/tools" onClick={close} className="link">
                Browse all tools
              </Link>
              .
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <p
                  aria-hidden="true"
                  className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-[0.08em] text-muted"
                >
                  {group.label}
                </p>
                {group.items.map((item) => {
                  optionIndex += 1;
                  const index = optionIndex;
                  return (
                    <PaletteRow
                      key={item.id}
                      item={item}
                      index={index}
                      active={index === active}
                      onSelect={close}
                      onHover={handleHover}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">Enter</kbd>
            to open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">Esc</kbd>
            to close
          </span>
        </div>
      </dialog>
    </>
  );
}
