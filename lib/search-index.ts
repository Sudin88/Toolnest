import { getCategory } from "@/lib/tools/categories";
import { toolMatchText } from "@/lib/tools/match-text";
import { liveTools } from "@/lib/tools/registry";
import type { ToolCategoryId } from "@/lib/tools/types";

/**
 * A deliberately tiny projection of the registry. Built on the server and passed
 * to the client search component so the browser never has to download the tool
 * definitions or their icon components just to filter a list.
 */
export interface SearchEntry {
  slug: string;
  name: string;
  tagline: string;
  /** The registry category id, for stable filters that must not match a label. */
  category: ToolCategoryId;
  /** The short display tag, e.g. "Image". */
  group: string;
  haystack: string;
}

export function buildSearchIndex(): SearchEntry[] {
  return liveTools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    category: tool.category,
    group: getCategory(tool.category).navLabel,
    haystack: toolMatchText(tool).toLowerCase(),
  }));
}
