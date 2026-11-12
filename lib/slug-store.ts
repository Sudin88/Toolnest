"use client";

import { useSyncExternalStore } from "react";

import { createJsonReader, emitKey, subscribeToKey, writeJson } from "@/lib/browser-store";

/**
 * A browser-local, newest-first list of tool slugs — the shape behind both
 * favourites and recents.
 *
 * The two differ only in their storage key, their cap and their event name, so
 * the defensive parsing, the cross-tab subscription and the move-to-front write
 * live here once. Each caller below is a few lines of configuration plus thin
 * re-exports, so no call site has to know this module exists.
 */
export interface SlugListStore {
  /** Slugs, newest first. Empty before hydration, so the server always agrees. */
  useSlugs(): string[];
  /** Put a slug at the front. A slug already at the head is left untouched. */
  add(slug: string): void;
  /** Drop a slug. */
  remove(slug: string): void;
  /** Add a slug when it is absent, drop it when it is present. */
  toggle(slug: string): void;
}

export function createSlugListStore({
  key,
  max,
  event,
}: {
  key: string;
  max: number;
  event: string;
}): SlugListStore {
  const EMPTY: string[] = [];

  const decode = (parsed: unknown): string[] => {
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, max);
  };

  const current = createJsonReader(() => window.localStorage, key, decode);

  const subscribe = (onChange: () => void) => subscribeToKey(key, event, onChange);
  const getServerSnapshot = () => EMPTY;

  function commit(next: string[]): void {
    writeJson(window.localStorage, key, next);
    emitKey(event);
  }

  function add(slug: string): void {
    const list = current();
    // Re-adding the head changes nothing, so skip the write and the event: every
    // tool-page mount otherwise re-renders every subscriber for no reason.
    if (list[0] === slug) return;
    commit([slug, ...list.filter((value) => value !== slug)].slice(0, max));
  }

  function remove(slug: string): void {
    const list = current();
    if (!list.includes(slug)) return;
    commit(list.filter((value) => value !== slug));
  }

  /** Slugs, newest first. A hook, so it reads through `useSyncExternalStore`. */
  function useSlugs(): string[] {
    return useSyncExternalStore(subscribe, current, getServerSnapshot);
  }

  return {
    useSlugs,
    add,
    remove,
    toggle: (slug: string) => {
      if (current().includes(slug)) remove(slug);
      else add(slug);
    },
  };
}
