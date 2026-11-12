import { componentSlugs } from "@/lib/tools/component-slugs";
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
/**
 * Declared but not built. Every consumer of the directory — the sitemap, the
 * search index, the category and home listings, and `generateStaticParams` — is
 * derived from `liveTools`, and `app/tools/[slug]/page.tsx` calls `notFound()`
 * for anything that is not live, so a planned entry cannot be routed, linked,
 * listed or indexed. Nothing in the registry is `planned` today, so that path is
 * covered structurally rather than by a definition; `tests/registry.test.ts`
 * asserts the partition that the coverage rests on.
 */
export const plannedTools = tools.filter((tool) => tool.status === "planned");

// Every live tool must have exactly one screen, and no screen may exist for a
// tool the registry does not call live. Without this, a renamed slug compiles,
// prerenders, gets linked and indexed, and serves a placeholder while calling a
// working tool "on the roadmap". `components/tools/tool-host.tsx` types its
// loader map against `componentSlugs`, so this one check closes the loop.
{
  const liveSlugs = new Set(liveTools.map((tool) => tool.slug));
  const screens = new Set<string>(componentSlugs);
  const missing = [...liveSlugs].filter((slug) => !screens.has(slug));
  const unknown = [...screens].filter((slug) => !liveSlugs.has(slug));

  if (missing.length > 0 || unknown.length > 0) {
    throw new Error(
      "The tool screens in components/tools/tool-host.tsx are out of step with the registry" +
        (missing.length > 0 ? ` — no screen for: ${missing.join(", ")}` : "") +
        (unknown.length > 0 ? ` — screens for unknown or planned tools: ${unknown.join(", ")}` : "") +
        ". Add the screen, remove the stale slug from lib/tools/component-slugs.ts, or flip the tool to \"live\".",
    );
  }
}

export function getTool(slug: string): ToolDefinition | undefined {
  return bySlug.get(slug);
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
