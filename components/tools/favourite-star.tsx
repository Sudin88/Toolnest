"use client";

import { Star } from "lucide-react";

import { toggleFavourite, useFavouriteSlugs } from "@/lib/favourites";
import { cn } from "@/lib/utils";

/**
 * The star on a tool page. It is the same storage the index rows write to, kept
 * in one place so a tool starred on the page is starred in the index the moment
 * the visitor returns. Before hydration it reads as unstarred, which matches the
 * server render, so there is no flicker.
 */
export function FavouriteStar({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const favourites = useFavouriteSlugs();
  const active = favourites.includes(slug);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => toggleFavourite(slug)}
      className={cn(
        "btn btn-secondary btn-sm",
        active && "border-accent text-accent",
        className,
      )}
    >
      <Star className={cn("size-4", active && "fill-current")} aria-hidden="true" />
      {active ? "Favourited" : "Favourite"}
      <span className="sr-only">, {name}</span>
    </button>
  );
}
