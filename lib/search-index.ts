import { getCategory } from "@/lib/tools/categories";
import { liveTools } from "@/lib/tools/registry";

/**
 * A deliberately tiny projection of the registry. Built on the server and passed
 * to the client search component so the browser never has to download the tool
 * definitions or their icon components just to filter a list.
 */
export interface SearchEntry {
  slug: string;
  name: string;
  tagline: string;
  group: string;
  haystack: string;
}

export function buildSearchIndex(): SearchEntry[] {
  return liveTools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    group: getCategory(tool.category).navLabel,
    haystack: [tool.name, tool.tagline, ...tool.keywords].join(" ").toLowerCase(),
  }));
}
