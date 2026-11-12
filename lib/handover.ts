"use client";

import { useEffect } from "react";

import { readJson, writeJson } from "@/lib/browser-store";
import { MAX_TEXT_LENGTH } from "@/lib/text";

/**
 * One-shot hand-over from the home box into a tool.
 *
 * When the smart box recognises pasted text and sends the visitor to a tool, it
 * drops the text under that tool's slug in `sessionStorage`. The tool reads it
 * once on mount and the key is deleted immediately, so a later visit is a clean
 * slate and nothing lingers.
 *
 * What may travel this way: short, text-like input only — a JSON payload, a URL,
 * a paragraph. Files, passwords, keys and anything a tool warns may contain
 * credentials never do; those tools do not call the hook. The value lives in the
 * tab and dies when the tab closes.
 */
const KEY = "toolnest-handover";

type Store = Record<string, string>;

function read(): Store {
  const parsed = readJson(window.sessionStorage, KEY);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
}

function write(store: Store): void {
  writeJson(window.sessionStorage, KEY, store);
}

/**
 * Stage text for a tool to pick up once, keyed by its slug.
 *
 * Text past `MAX_TEXT_LENGTH` is not staged: no tool processes that much, so it
 * would only buy a synchronous multi-megabyte write that storage is free to
 * refuse. The cap is the same one the tools apply to their own input, so nothing
 * a tool would have used is lost.
 */
export function setHandover(slug: string, text: string): void {
  if (!text || text.length > MAX_TEXT_LENGTH) return;
  const store = read();
  store[slug] = text;
  write(store);
}

/**
 * Read and clear a staged value. Returns null when there is nothing waiting.
 *
 * The slug is **not** validated here, and deliberately so: it comes from a
 * compile-time literal at each call site (`useToolInput` passes the tool's own
 * slug), never from a URL parameter or any other visitor-controlled value, so it
 * can only ever be a real slug. Validating it would pull the whole registry into
 * the client bundle for no gain. If a future caller ever derives the slug from
 * the URL, it must validate against `isLive` before calling this.
 */
export function takeHandover(slug: string): string | null {
  const store = read();
  const text = store[slug];
  if (typeof text !== "string" || text.length === 0) return null;
  delete store[slug];
  write(store);
  return text;
}

/**
 * Apply a staged value at most once, after mount. The effect runs on the client
 * only, so the server HTML and the first client render agree; the input is
 * filled the moment the tool is interactive.
 *
 * `apply` is expected to be stable (`useToolInput` passes a `useCallback`). If a
 * caller hands over an unstable function the effect re-runs, but `takeHandover`
 * has already deleted the key, so it finds nothing and does nothing.
 */
export function useHandoverText(slug: string, apply: (text: string) => void): void {
  useEffect(() => {
    const text = takeHandover(slug);
    if (text !== null) apply(text);
  }, [slug, apply]);
}
