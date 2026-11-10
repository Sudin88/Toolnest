import { cn } from "@/lib/utils";

/**
 * The ToolNest mark: a hub with three connections inside a rounded nest.
 * Drawn as a masked span so it inherits the brand gradient without shipping an
 * inline gradient definition (see `.logo-symbol` in globals.css).
 */
export function LogoMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("logo-symbol shrink-0", className)}
      style={{ "--logo-size": `${size}px` } as React.CSSProperties}
    />
  );
}

export function Logo({
  className,
  size = 28,
  withWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withWordmark ? (
        <span
          className={cn(
            "font-display text-[1.0625rem] font-extrabold tracking-[-0.03em] text-fg",
            wordmarkClassName,
          )}
        >
          ToolNest
        </span>
      ) : null}
    </span>
  );
}
