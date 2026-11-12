import { cn } from "@/lib/utils";

/**
 * The AllTools mark: a tray holding a tool head — a nest, drawn from two
 * strokes. It is a masked span so the symbol is a single colour that follows
 * the theme (see `.logo-symbol` in globals.css), and it stays legible at 16px
 * as the favicon.
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
            "text-[1.3rem] font-semibold leading-none tracking-[-0.02em] text-fg",
            wordmarkClassName,
          )}
        >
          AllTools
        </span>
      ) : null}
    </span>
  );
}
