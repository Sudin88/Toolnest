import Link from "next/link";

import { guideReadingMinutes } from "@/lib/guides/registry";
import type { Guide } from "@/lib/guides/types";
import { cn } from "@/lib/utils";

/**
 * One guide, as it appears on the guides index and on a category page: a
 * hairline, a title, the summary and the reading estimate. The whole card is
 * the link, so the target is never a few words at the end of a sentence.
 */
export function GuideCard({ guide, className }: { guide: Guide; className?: string }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className={cn("group block border-t border-line pt-6 no-underline", className)}
    >
      <h3 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-fg transition-colors duration-150 ease-out group-hover:text-accent-text">
        {guide.title}
      </h3>
      <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {guide.description}
      </p>
      <p className="num mt-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">
        {guideReadingMinutes(guide)} min read
      </p>
    </Link>
  );
}
