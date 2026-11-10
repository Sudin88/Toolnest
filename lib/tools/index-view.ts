import { categories, getCategory } from "@/lib/tools/categories";
import { liveToolsInCategory } from "@/lib/tools/registry";
import type { ToolCategoryId, ToolDefinition } from "@/lib/tools/types";

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
  categorySlug: string;
  /** The short tag, e.g. "Image". */
  categoryLabel: string;
}

export interface ToolIndexGroup {
  id: ToolCategoryId;
  slug: string;
  name: string;
  tagline: string;
  items: ToolIndexItem[];
}

function toItem(tool: ToolDefinition): ToolIndexItem {
  const category = getCategory(tool.category);
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    local: tool.local,
    categorySlug: category.slug,
    categoryLabel: category.navLabel,
  };
}

/**
 * Live tools grouped by category, in registry order, with empty categories
 * dropped. Grouping is derived, never hand-listed, so a category that ships its
 * first tool appears in the index on its own.
 */
export function indexGroups(): ToolIndexGroup[] {
  return categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      tagline: category.tagline,
      items: liveToolsInCategory(category.id).map(toItem),
    }))
    .filter((group) => group.items.length > 0);
}

/** A flat list of every live tool, for recents lookup on the client. */
export function indexCatalog(): ToolIndexItem[] {
  return indexGroups().flatMap((group) => group.items);
}
