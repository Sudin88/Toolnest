import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { goals } from "@/lib/goals";
import { indexCatalog } from "@/lib/tools/index-view";

/**
 * “Which tool do I need?” — the page read a second way.
 *
 * The index below is organised the way the product is built (by shelf); this
 * block is organised the way a visitor arrives (by job). Each goal names registry
 * slugs, and the names beside them are resolved from the registry here, on the
 * server, so nothing in the copy is hardcoded. `lib/content-check.ts` asserts
 * every one of those slugs is live at build time, so a rename fails the build
 * rather than leaving a dead link.
 */
export function GoalsBlock() {
  const catalog = indexCatalog();
  const bySlug = new Map(catalog.map((item) => [item.slug, item]));

  return (
    <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const primary = bySlug.get(goal.slugs[0]);
        if (!primary) return null;
        const secondary = goal.slugs
          .slice(1)
          .map((slug) => bySlug.get(slug))
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        return (
          <li key={goal.id} className="flex flex-col bg-canvas p-5">
            <h3 className="text-[1.0625rem] font-bold leading-snug tracking-[-0.01em] text-fg">
              {goal.title}
            </h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{goal.blurb}</p>
            <p className="mt-4">
              <Link
                href={`/tools/${primary.slug}`}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-text no-underline hover:underline"
              >
                {primary.name}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </p>
            {secondary.length > 0 ? (
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                {secondary.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/tools/${item.slug}`}
                    className="text-muted no-underline hover:text-fg hover:underline"
                  >
                    {item.name}
                  </Link>
                ))}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
