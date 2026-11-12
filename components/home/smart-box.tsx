"use client";

import { ArrowRight, Image as ImageIcon, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from "react";

import { setHandover } from "@/lib/handover";
import { PASTE_DETECT_SLUGS, detectInput } from "@/lib/paste-detect";
import type { SearchEntry } from "@/lib/search-index";
import { rankEntries } from "@/lib/search-rank";
import { cn } from "@/lib/utils";

/**
 * The one field the home page leads with.
 *
 * It accepts three things and guesses what they are: a typed search, pasted
 * text, or a dropped image. Typed words fall through to the ordinary ranker.
 * Pasted text is run through `detectInput`, which is a pure function — see the
 * case table in `lib/paste-detect.ts` — and the tools that evidently accept it
 * are offered first, each with the reason it was chosen. A dropped image offers
 * the image shelf instead, read from the registry rather than hardcoded.
 *
 * Choosing a text tool stages the text for it (see `lib/handover.ts`) so the
 * visitor lands with their input already there. Files never travel that way:
 * the browser hands them over through the tool's own picker, not through
 * storage.
 */

const HANDOVER_SLUGS = new Set(PASTE_DETECT_SLUGS);
const MAX_RESULTS = 6;

interface Suggestion {
  slug: string;
  name: string;
  tagline: string;
  reason?: string;
  handover: boolean;
}

export function SmartBox({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dropped, setDropped] = useState<{ name: string; size: number } | null>(null);

  const bySlug = useMemo(() => new Map(entries.map((entry) => [entry.slug, entry])), [entries]);
  const detection = useMemo(() => detectInput(value), [value]);
  const imageTools = useMemo(
    () => entries.filter((entry) => entry.category === "image").slice(0, 4),
    [entries],
  );

  const { label, suggestions } = useMemo<{ label: string; suggestions: Suggestion[] }>(() => {
    if (dropped) {
      return {
        label: "Image file: pick a tool",
        suggestions: imageTools.map((entry) => ({
          slug: entry.slug,
          name: entry.name,
          tagline: entry.tagline,
          handover: false,
        })),
      };
    }

    if (detection.suggestions.length > 0) {
      const found: Suggestion[] = [];
      for (const suggestion of detection.suggestions) {
        const entry = bySlug.get(suggestion.slug);
        if (!entry) continue;
        found.push({
          slug: entry.slug,
          name: entry.name,
          tagline: entry.tagline,
          reason: suggestion.reason,
          handover: HANDOVER_SLUGS.has(entry.slug),
        });
      }
      if (found.length > 0) return { label: detection.label, suggestions: found };
    }

    return {
      label: "Tools",
      suggestions: rankEntries(entries, value, MAX_RESULTS).map((entry) => ({
        slug: entry.slug,
        name: entry.name,
        tagline: entry.tagline,
        handover: false,
      })),
    };
  }, [dropped, imageTools, detection, bySlug, entries, value]);

  const hasInput = value.trim().length > 0 || dropped !== null;
  const showList = focused && hasInput && suggestions.length > 0;

  function choose(item: Suggestion) {
    // Only text-like tools are staged, and only when the text is what is being
    // handed over — never a file.
    if (item.handover && !dropped && value.trim().length > 0) {
      setHandover(item.slug, value);
    }
    setFocused(false);
    setDropped(null);
    router.push(`/tools/${item.slug}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // A blank field has nothing to rank, and `rankEntries` answers an empty
    // query with the first tools in the index — so submitting it would open
    // whichever tool happens to be first. Send the visitor to the index instead.
    if (!value.trim() && !dropped) {
      router.push(`/tools`);
      return;
    }
    const target = suggestions[active] ?? suggestions[0];
    if (target) choose(target);
    else router.push(`/tools`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (suggestions.length ? (index + 1) % suggestions.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (suggestions.length ? (index - 1 + suggestions.length) % suggestions.length : 0));
    } else if (event.key === "Escape") {
      setFocused(false);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          setDropped({ name: file.name || "Pasted image", size: file.size });
          setFocused(true);
          return;
        }
      }
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setDropped({ name: file.name, size: file.size });
      setFocused(true);
    }
  }

  const example = entries[0]?.name.toLowerCase() ?? "json";

  return (
    <div
      className="relative"
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <form onSubmit={onSubmit} role="search" className="flex flex-col gap-2.5 sm:flex-row">
        <div className={cn("search-shell h-14 flex-1 sm:h-16", dragging && "border-accent bg-surface-2")}>
          <Search className="pointer-events-none absolute left-4 size-5 text-muted" aria-hidden="true" />
          <input
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls="home-smart-results"
            aria-autocomplete="list"
            aria-activedescendant={showList && suggestions[active] ? `home-option-${suggestions[active].slug}` : undefined}
            aria-label="Search tools, or paste text and an image"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setDropped(null);
              setActive(0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            autoComplete="off"
            placeholder={`Search ${entries.length} tools, or paste text: try “${example}”`}
            className="h-full w-full rounded-md bg-transparent pl-12 pr-4 text-base text-fg outline-none placeholder:text-muted"
          />
          {dropped ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setDropped(null)}
              className="mr-2 flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 text-xs text-muted"
            >
              <ImageIcon className="size-3.5" aria-hidden="true" />
              <span className="max-w-[10rem] truncate text-fg">{dropped.name}</span>
              <X className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Remove the dropped file</span>
            </button>
          ) : null}
        </div>
        <button type="submit" className="btn btn-primary h-14 px-7 text-base sm:h-16">
          Search
        </button>
      </form>

      {dragging ? (
        <p className="pointer-events-none absolute inset-x-0 -bottom-8 text-center text-sm text-accent-text">
          Drop an image to see its tools.
        </p>
      ) : null}

      {showList ? (
        <ul
          id="home-smart-results"
          role="listbox"
          aria-label="Suggestions"
          className="panel absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-96 overflow-y-auto p-2 shadow-lg"
        >
          <li
            aria-hidden="true"
            className="px-3 pb-1 pt-2 font-mono text-xs uppercase tracking-[0.08em] text-muted"
          >
            {label}
          </li>
          {suggestions.map((item, index) => (
            <li key={item.slug} role="none">
              <Link
                id={`home-option-${item.slug}`}
                role="option"
                aria-selected={index === active}
                href={`/tools/${item.slug}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(item);
                }}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 no-underline",
                  index === active ? "bg-surface-2" : "",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                  <span className="block truncate text-xs text-muted">{item.reason ?? item.tagline}</span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
