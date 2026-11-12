import { categories, getCategory } from "@/lib/tools/categories";
import { liveToolsInCategory } from "@/lib/tools/registry";
import type { ToolDefinition } from "@/lib/tools/types";

/**
 * The shape the directory renders. It is deliberately plain data with no icon
 * components on it, so the same structure can be built on the server and handed
 * to a client filter without pulling the registry into the browser bundle.
 */
export interface ToolIndexItem {
  slug: string;
  name: string;
  tagline: string;
  /** True when the tool never sends input off the device. */
  local: boolean;
  /** The short tag, e.g. "Image". */
  categoryLabel: string;
  /**
   * Lowercased `name + tagline + categoryLabel`, built once when the index is
   * projected. The live filter then tests this string instead of rebuilding the
   * same concatenation for every item on every keystroke.
   */
  haystack: string;
}

export interface ToolIndexGroup {
  slug: string;
  name: string;
  items: ToolIndexItem[];
}

function toItem(tool: ToolDefinition): ToolIndexItem {
  const category = getCategory(tool.category);
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    local: tool.local,
    categoryLabel: category.navLabel,
    haystack: `${tool.name} ${tool.tagline} ${category.navLabel}`.toLowerCase(),
  };
}

/**
 * Live tools grouped by category, in registry order, with empty categories
 * dropped. Grouping is derived, never hand-listed, so a category that ships its
 * first tool appears in the index on its own. Filtering keys off `slug`, which
 * is what the chips and the anchors already use.
 */
export function indexGroups(): ToolIndexGroup[] {
  return categories
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      items: liveToolsInCategory(category.id).map(toItem),
    }))
    .filter((group) => group.items.length > 0);
}

/** A flat list of every live tool, for recents lookup on the client. */
export function indexCatalog(): ToolIndexItem[] {
  return indexGroups().flatMap((group) => group.items);
}
