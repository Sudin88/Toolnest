import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Homepage section scaffolding. The vertical rhythm lives in one place (the
 * `.section-y` class) so the page cannot drift into uneven gaps, and every
 * section heading has the same relationship between title and description.
 */
export function Section({
  labelId,
  className,
  children,
}: {
  labelId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={labelId} className={cn("container-page section-y", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <h2
          id={id}
          className="text-[1.75rem] leading-tight tracking-[-0.02em] text-fg sm:text-[2.25rem]"
        >
          {title}
        </h2>
        {description ? (
          <p className="measure mt-2.5 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
