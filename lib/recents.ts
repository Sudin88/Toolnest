"use client";

import { createSlugListStore } from "@/lib/slug-store";

/**
 * Recently opened tools, kept in localStorage as a short list of slugs. The
 * directory data itself stays on the server, so the browser stores nothing but
 * identifiers. Every read and write is wrapped: a visitor in private mode, or
 * one who has filled their quota, simply gets no recents rather than an error.
 */
const store = createSlugListStore({
  key: "toolnest-recents",
  max: 6,
  event: "toolnest:recents",
});

/** Slugs of recently opened tools, newest first. Empty before hydration. */
export const useRecentSlugs = store.useSlugs;

/** Move a slug to the front of the list, capped and de-duplicated. */
export const recordRecent = store.add;
