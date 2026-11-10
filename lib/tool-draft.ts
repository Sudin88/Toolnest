"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A session-scoped draft of the small inputs a tool remembers while the visitor
 * stays in the tab — a loan amount, a unit, a paragraph of text. It is kept in
 * `sessionStorage`, so it disappears when the tab closes and is never shared
 * across tabs or devices.
 *
 * What may be drafted: short settings and small typed input.
 * What must never be drafted: files, passwords, secrets, tokens, or a payload
 * the tool itself warns may contain credentials. Those tools keep plain state.
 */
const KEY = "toolnest-draft";
const EVENT = "toolnest:draft";

type Store = Record<string, Record<string, unknown>>;

const EMPTY: Store = {};

let cacheRaw: string | null = null;
let cacheValue: Store = EMPTY;

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Store {
  const raw = readRaw();
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  cacheValue =
    raw === null ? EMPTY : ((): Store => {
      try {
        const parsed: unknown = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Store)
          : EMPTY;
      } catch {
        return EMPTY;
      }
    })();
  return cacheValue;
}

function getServerSnapshot(): Store {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function write(tool: string, field: string, value: unknown): void {
  try {
    const current = getSnapshot();
    const next: Store = { ...current, [tool]: { ...(current[tool] ?? {}), [field]: value } };
    const raw = JSON.stringify(next);
    window.sessionStorage.setItem(KEY, raw);
    cacheRaw = raw;
    cacheValue = next;
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Drafting is a convenience. Never let storage break the tool.
  }
}

/**
 * State that behaves like `useState` but survives a reload within the session.
 * Before hydration it renders `initial`, so the server and the first client
 * render agree.
 */
export function useToolDraft<T>(tool: string, field: string, initial: T): [T, (value: T) => void] {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const stored = store[tool]?.[field];
  const value = (stored === undefined ? initial : stored) as T;
  const set = useCallback((next: T) => write(tool, field, next), [tool, field]);
  return [value, set];
}
