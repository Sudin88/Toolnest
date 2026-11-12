import type { ToolDefinition } from "@/lib/tools/types";

/**
 * The text a tool is matched on: its name, its tagline and its search keywords.
 *
 * Both the header search index and the on-page directory filter build their
 * haystack from this one function, so a keyword that finds a tool in the header
 * also finds it in the filter. Keeping the list in one place is the point: the
 * two projections previously wrote the concatenation out separately in
 * `search-index.ts` and `index-view.ts`, and only one of them included the
 * keywords.
 *
 * The callers lowercase the result and may append their own terms (the index
 * view adds the category label); this only covers the tool itself.
 */
export function toolMatchText(tool: ToolDefinition): string {
  return [tool.name, tool.tagline, ...tool.keywords].join(" ");
}
