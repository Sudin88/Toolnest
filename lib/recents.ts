"use client";

import { useSyncExternalStore } from "react";

/**
 * Recently opened tools, kept in localStorage as a short list of slugs. The
 * directory data itself stays on the server, so the browser stores nothing but
 * identifiers. Every read and write is wrapped: a visitor in private mode, or
 * one who has filled their quota, simply gets no recents rather than an error.
 */
const KEY = "toolnest-recents";
const MAX = 6;
const EVENT = "toolnest:recents";

const EMPTY: string[] = [];

let cacheRaw: string | null = null;
let cacheValue: string[] = EMPTY;

function parse(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((value): value is string => typeof value === "string").slice(0, MAX);
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): string[] {
  const raw = readRaw();
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  cacheValue = parse(raw);
  return cacheValue;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Slugs of recently opened tools, newest first. Empty before hydration. */
export function useRecentSlugs(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Move a slug to the front of the list, capped and de-duplicated. */
export function recordRecent(slug: string): void {
  try {
    const next = [slug, ...getSnapshot().filter((value) => value !== slug)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Recents are a convenience. Never let storage break the tool.
  }
}

export function clearRecents(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Nothing to do.
  }
}
