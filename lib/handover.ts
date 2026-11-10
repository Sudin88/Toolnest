"use client";

import { useEffect } from "react";

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
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Hand-over is a nicety. Never let storage break navigation.
  }
}

/** Stage text for a tool to pick up once, keyed by its slug. */
export function setHandover(slug: string, text: string): void {
  if (!text) return;
  const store = read();
  store[slug] = text;
  write(store);
}

/** Read and clear a staged value. Returns null when there is nothing waiting. */
export function takeHandover(slug: string): string | null {
  try {
    const store = read();
    const text = store[slug];
    if (typeof text !== "string" || text.length === 0) return null;
    delete store[slug];
    write(store);
    return text;
  } catch {
    return null;
  }
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
