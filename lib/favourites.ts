"use client";

import { useSyncExternalStore } from "react";

/**
 * Browser-local favourites, kept in localStorage as slugs.
 *
 * Deliberately the same shape and the same failure posture as `lib/recents.ts`:
 * every read and write is wrapped, so a visitor in private mode, over quota, or
 * with storage switched off simply gets no favourites rather than an error, and
 * the UI renders nothing extra — no empty box, no layout shift.
 */
const KEY = "toolnest-favourites";
const MAX = 12;
const EVENT = "toolnest:favourites";

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

function commit(next: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Favourites are a convenience. Never let storage break the tool.
  }
}

/** Slugs the visitor has starred, newest first. Empty before hydration. */
export function useFavouriteSlugs(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Star or unstar a slug. The newest favourite sits first. */
export function toggleFavourite(slug: string): void {
  const current = getSnapshot();
  if (current.includes(slug)) {
    commit(current.filter((value) => value !== slug));
    return;
  }
  commit([slug, ...current].slice(0, MAX));
}
