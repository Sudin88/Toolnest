import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Presentational pieces shared by every tool. These carry no state and no event
 * handlers, so a server component can render them too.
 */

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</dl>;
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="panel-inset px-4 py-3">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="num mt-1 text-xl font-bold leading-none text-fg">{value}</dd>
      {hint ? <dd className="mt-1.5 text-xs leading-snug text-muted">{hint}</dd> : null}
    </div>
  );
}

export function Note({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "warn";
  className?: string;
}) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <p
      className={cn(
        "flex gap-2.5 rounded-md border px-3.5 py-3 text-sm leading-relaxed text-muted",
        tone === "warn" ? "border-highlight/45 bg-highlight/5" : "border-line bg-surface-2",
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", tone === "warn" ? "text-highlight" : "text-accent")}
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  );
}

export function OutputBox({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "pre";
}) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "scroll-region field-mono max-h-80 min-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md border border-line bg-surface-2 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-fg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex min-h-24 items-center justify-center rounded-md border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SubHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="font-display text-[0.9375rem] font-bold text-fg">
      {children}
    </h3>
  );
}
