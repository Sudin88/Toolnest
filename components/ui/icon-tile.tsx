import type { IconType } from "react-icons";

import { cn } from "@/lib/utils";

/**
 * The single icon slot used across the site. It reserves a fixed square so a
 * tool row and a category row line up, and it paints the glyph in the colour of
 * the item it belongs to — a red for the PDF shelf, a neutral ink for text —
 * rather than in a container colour of its own.
 *
 * The size classes and the transparent container live in globals.css; nothing
 * here hardcodes a colour. `color` is a plain CSS colour supplied by the
 * registry.
 */
const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "icon-tile-sm",
  md: "icon-tile-md",
  lg: "icon-tile-lg",
};

const GLYPH_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
};

export function IconTile({
  icon: Icon,
  size = "md",
  color,
  className,
}: {
  icon: IconType;
  size?: "sm" | "md" | "lg";
  /** The icon's colour, usually the category colour from the registry. */
  color?: string;
  className?: string;
}) {
  return (
    <span className={cn("icon-tile", SIZE_CLASS[size], className)} style={color ? { color } : undefined}>
      <Icon className={GLYPH_CLASS[size]} aria-hidden="true" />
    </span>
  );
}
