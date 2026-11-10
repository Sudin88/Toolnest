"use client";

import { History, Star } from "lucide-react";
import Link from "next/link";

import type { ToolIndexItem } from "@/lib/tools/index-view";
import { useFavouriteSlugs } from "@/lib/favourites";
import { useRecentSlugs } from "@/lib/recents";

/**
 * What the visitor was doing last: what they starred, then what they opened.
 *
 * Both lists live in the browser, so on the server and before hydration this
 * renders nothing at all — a first-time visitor never sees an empty box, and one
 * with history gets the strip the moment React hydrates. Favourites come first
 * under “Pinned”; a tool that is both pinned and recent shows once.
 */
export function HomeShortcuts({ catalog }: { catalog: ToolIndexItem[] }) {
  const favouriteSlugs = useFavouriteSlugs();
  const recentSlugs = useRecentSlugs();

  const bySlug = new Map(catalog.map((item) => [item.slug, item]));
  const resolve = (slugs: string[]) =>
    slugs.map((slug) => bySlug.get(slug)).filter((item): item is ToolIndexItem => Boolean(item));

  const pinned = resolve(favouriteSlugs).slice(0, 6);
  const pinnedSet = new Set(pinned.map((item) => item.slug));
  const recent = resolve(recentSlugs)
    .filter((item) => !pinnedSet.has(item.slug))
    .slice(0, 6);

  if (pinned.length === 0 && recent.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-4">
      {pinned.length > 0 ? (
        <ShortcutRow label="Pinned" icon="star" items={pinned} />
      ) : null}
      {recent.length > 0 ? (
        <ShortcutRow label="Pick up where you left off" icon="history" items={recent} />
      ) : null}
    </div>
  );
}

function ShortcutRow({
  label,
  icon,
  items,
}: {
  label: string;
  icon: "star" | "history";
  items: ToolIndexItem[];
}) {
  const Icon = icon === "star" ? Star : History;

  return (
    <div>
      <p className="eyebrow">{label}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/tools/${item.slug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-fg no-underline transition-colors duration-150 ease-out hover:border-accent hover:bg-surface-2"
            >
              <Icon className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
