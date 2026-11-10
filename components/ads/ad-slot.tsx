import { AdUnit } from "@/components/ads/ad-unit";
import { adsEnabled } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * A policy-conscious ad container.
 *
 * - Renders nothing at all unless NEXT_PUBLIC_ADSENSE_CLIENT is a real publisher id.
 * - Reserves height so enabling ads cannot introduce layout shift.
 * - Labelled as an advertisement so it cannot be mistaken for a control.
 * - Never placed inside a tool workspace, beside a download button, or between a
 *   file-upload control and its result.
 */
export function AdSlot({
  slot,
  className,
  minHeight = 120,
  format = "horizontal",
}: {
  slot: string;
  className?: string;
  minHeight?: number;
  format?: "horizontal" | "rectangle";
}) {
  if (!adsEnabled || !slot) return null;

  return (
    <aside
      className={cn("container-page", className)}
      aria-label="Advertisement"
      style={{ contain: "layout" }}
    >
      <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Advertisement</p>
      <div
        className="flex items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2"
        style={{ minHeight, maxWidth: format === "rectangle" ? 340 : undefined }}
      >
        <AdUnit slot={slot} />
      </div>
    </aside>
  );
}
