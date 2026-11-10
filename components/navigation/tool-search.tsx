"use client";

import { CornerDownLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { SearchEntry } from "@/lib/search-index";
import { rankEntries } from "@/lib/search-rank";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 8;

export function ToolSearch({ entries }: { entries: SearchEntry[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => rankEntries(entries, query, MAX_RESULTS), [entries, query]);

  useEffect(() => setActive(0), [query]);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    dialog.showModal();
    // Focus lands in the field, which is the only thing a visitor wants to use.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Cmd/Ctrl+K opens search from anywhere, matching what people expect.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
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
    const node = listRef.current?.children[active] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      const target = results[active];
      if (target) {
        event.preventDefault();
        close();
        router.push(`/tools/${target.slug}`);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="group hidden h-11 min-w-[15rem] items-center gap-2.5 rounded-md border border-line bg-surface-2 px-3 text-left text-sm text-muted transition-colors duration-150 ease-out hover:border-line-strong hover:text-fg sm:flex sm:w-64"
      >
        <Search className="size-[17px] shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">Search tools</span>
        <kbd className="hidden shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted lg:inline">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={open}
        aria-label="Search tools"
        className="inline-flex size-11 items-center justify-center rounded-md border border-line text-fg transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-accent sm:hidden"
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
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search by name or task…"
            aria-label="Search tools"
            aria-controls="tool-search-results"
            aria-activedescendant={results[active] ? `tool-search-option-${results[active].slug}` : undefined}
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted"
          />
        </div>

        <ul
          ref={listRef}
          id="tool-search-results"
          role="listbox"
          aria-label="Matching tools"
          className="scroll-region max-h-[min(24rem,60dvh)] p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">
              No tool matches “{query}”.{" "}
              <Link href="/tools" onClick={close} className="link">
                Browse all tools
              </Link>
              .
            </li>
          ) : (
            results.map((entry, index) => (
              <li key={entry.slug} role="none">
                <Link
                  id={`tool-search-option-${entry.slug}`}
                  role="option"
                  aria-selected={index === active}
                  href={`/tools/${entry.slug}`}
                  onClick={close}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 no-underline",
                    index === active ? "bg-surface-2 text-fg" : "text-fg",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{entry.name}</span>
                    <span className="block truncate text-xs text-muted">{entry.tagline}</span>
                  </span>
                  <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[0.6875rem] text-muted">
                    {entry.group}
                  </span>
                  {index === active ? (
                    <CornerDownLeft className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
      </dialog>
    </>
  );
}
