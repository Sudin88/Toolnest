import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn, formatNumber } from "@/lib/utils";

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
    <div className="panel-inset px-4 py-3.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="num mt-1.5 text-xl font-bold leading-none text-fg">{value}</dd>
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

/**
 * Shown in place of a result when a paste is past the cap a tool processes in one
 * go. The text stays in its box, so nothing is lost — the cap only stops the
 * pass that would otherwise stall the tab.
 */
export function LimitNote({ length, limit }: { length: number; limit: number }) {
  return (
    <Note tone="warn">
      At {formatNumber(length)} characters this paste is past the {formatNumber(limit)}-character
      limit for one run. Nothing has been sent anywhere — trim it down and the result appears again.
    </Note>
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

/**
 * The blank slate for a tool that has nothing to show yet. When `action` is
 * supplied it sits under the sentence, giving the visitor a one-click way to see
 * the tool working with an example rather than an empty box to stare at.
 */
export function Empty({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted",
        className,
      )}
    >
      <p>{children}</p>
      {action}
    </div>
  );
}

/**
 * One shared way to drop a worked example into a tool. Every example is a small
 * constant next to its tool, so the button only ever sets state the tool already
 * owns — it never invents content.
 */
export function TryExample({ onClick, children }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={onClick}>
      {children ?? "Try an example"}
    </button>
  );
}

/**
 * The result footer every tool ends with. The label sits left, the actions sit
 * right in a fixed order: the primary action (Copy or Download) is always the
 * first button, so it lands in the same place on every tool, and the inline
 * “Copied” confirmation comes from the button itself rather than a floating
 * toast. Keeping it one component is what makes the position predictable.
 */
export function ResultFooter({
  label = "Result",
  children,
  className,
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex flex-wrap items-center justify-between gap-3", className)}>
      <span className="label mb-0">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function SubHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="font-display text-[0.9375rem] font-bold text-fg">
      {children}
    </h3>
  );
}
