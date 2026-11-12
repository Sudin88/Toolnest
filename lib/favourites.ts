"use client";

import { createSlugListStore } from "@/lib/slug-store";

/**
 * Browser-local favourites, kept in localStorage as slugs.
 *
 * Deliberately the same shape and the same failure posture as `lib/recents.ts`
 * — both are the one slug-list store with a different key, cap and event. Every
 * read and write is wrapped, so a visitor in private mode, over quota, or with
 * storage switched off simply gets no favourites rather than an error, and the
 * UI renders nothing extra — no empty box, no layout shift.
 */
const store = createSlugListStore({
  key: "toolnest-favourites",
  max: 12,
  event: "toolnest:favourites",
});

/** Slugs the visitor has starred, newest first. Empty before hydration. */
export const useFavouriteSlugs = store.useSlugs;

/** Star or unstar a slug. The newest favourite sits first. */
export const toggleFavourite = store.toggle;
