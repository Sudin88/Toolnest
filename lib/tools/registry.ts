import { calculatorTools } from "@/lib/tools/definitions/calculators";
import { dailyTools } from "@/lib/tools/definitions/daily";
import { developerTools } from "@/lib/tools/definitions/developer";
import { imageTools } from "@/lib/tools/definitions/image";
import { pdfTools } from "@/lib/tools/definitions/pdf";
import { textTools } from "@/lib/tools/definitions/text";
import type { ToolCategoryId, ToolDefinition } from "@/lib/tools/types";

/**
 * The registry is the single source of truth for the product. Navigation, the
 * homepage, category pages, search, the sitemap and structured data are all
 * derived from this list — adding a tool here is the whole job.
 */
export const tools: ToolDefinition[] = [
  ...pdfTools,
  ...imageTools,
  ...textTools,
  ...developerTools,
  ...calculatorTools,
  ...dailyTools,
].sort((a, b) => (a.rank === b.rank ? a.name.localeCompare(b.name) : b.rank - a.rank));

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

// Fail loudly at build time rather than shipping a broken route.
if (bySlug.size !== tools.length) {
  const seen = new Set<string>();
  const duplicates = tools.map((t) => t.slug).filter((s) => (seen.has(s) ? true : (seen.add(s), false)));
  throw new Error(`Duplicate tool slug(s) in the registry: ${duplicates.join(", ")}`);
}

export const liveTools = tools.filter((tool) => tool.status === "live");
export const plannedTools = tools.filter((tool) => tool.status === "planned");

export function getTool(slug: string): ToolDefinition | undefined {
  return bySlug.get(slug);
}

/** Throws when the slug is unknown — use where the caller already resolved a route. */
export function requireTool(slug: string): ToolDefinition {
  const tool = bySlug.get(slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

export function isLive(slug: string): boolean {
  return bySlug.get(slug)?.status === "live";
}

export function toolsInCategory(category: ToolCategoryId): ToolDefinition[] {
  return tools.filter((tool) => tool.category === category);
}

export function liveToolsInCategory(category: ToolCategoryId): ToolDefinition[] {
  return liveTools.filter((tool) => tool.category === category);
}

export function countByCategory(category: ToolCategoryId) {
  const all = toolsInCategory(category);
  return {
    total: all.length,
    live: all.filter((tool) => tool.status === "live").length,
  };
}

export function popularTools(limit = 8): ToolDefinition[] {
  return liveTools.slice(0, limit);
}

export function recentlyAdded(limit = 6): ToolDefinition[] {
  return [...liveTools]
    .sort((a, b) => b.added.localeCompare(a.added))
    .slice(0, limit);
}

/**
 * Sibling tools in the same category first, then the most popular tools
 * elsewhere — keeps every page internally linked without hand-maintained lists.
 */
export function relatedTools(slug: string, limit = 4): ToolDefinition[] {
  const tool = bySlug.get(slug);
  if (!tool) return popularTools(limit);

  const siblings = liveTools.filter((t) => t.category === tool.category && t.slug !== slug);
  const others = liveTools.filter((t) => t.category !== tool.category);
  return [...siblings, ...others].slice(0, limit);
}

/** Case-insensitive match across name, tagline, keywords and description. */
export function searchTools(query: string, limit = 12): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/);
  const scored = liveTools
    .map((tool) => {
      const name = tool.name.toLowerCase();
      const tagline = tool.tagline.toLowerCase();
      const haystack = [name, tagline, ...tool.keywords.map((k) => k.toLowerCase()), tool.description.toLowerCase()];

      let score = 0;
      for (const term of terms) {
        let matched = false;
        if (name.startsWith(term)) {
          score += 60;
          matched = true;
        } else if (name.includes(term)) {
          score += 40;
          matched = true;
        }
        if (tagline.includes(term)) {
          score += 14;
          matched = true;
        }
        if (tool.keywords.some((k) => k.toLowerCase().includes(term))) {
          score += 8;
          matched = true;
        }
        if (!matched && haystack.some((h) => h.includes(term))) {
          score += 3;
          matched = true;
        }
        if (!matched) return { tool, score: -1 };
      }
      return { tool, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.tool.rank - a.tool.rank);

  return scored.slice(0, limit).map((entry) => entry.tool);
}

/** Categories that actually have at least one shipped tool. */
export function liveCategories(): ToolCategoryId[] {
  return [...new Set(liveTools.map((tool) => tool.category))];
}
