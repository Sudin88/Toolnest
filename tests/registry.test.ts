import { describe, expect, it } from "vitest";

import { buildSearchIndex } from "@/lib/search-index";
import { componentSlugs } from "@/lib/tools/component-slugs";
import { getTool, isLive, liveTools, plannedTools, tools } from "@/lib/tools/registry";

/**
 * The safety property the whole directory rests on is that only `live` tools are
 * ever routed, linked, listed, searched or added to the sitemap. There is no
 * `planned` tool in the registry today, so the tests below assert the partition
 * that property is built from rather than the end-to-end path of a hypothetical
 * planned entry; `lib/tools/registry.ts` records that decision next to the
 * `plannedTools` definition.
 */
describe("registry", () => {
  it("gives every tool a unique slug", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("splits the tools into live and planned without overlap or gaps", () => {
    const live = new Set(liveTools.map((tool) => tool.slug));
    const planned = new Set(plannedTools.map((tool) => tool.slug));

    expect(liveTools.every((tool) => tool.status === "live")).toBe(true);
    expect(plannedTools.every((tool) => tool.status === "planned")).toBe(true);
    expect([...live].filter((slug) => planned.has(slug))).toEqual([]);
    expect(live.size + planned.size).toBe(tools.length);
  });

  it("maps every live tool to exactly one screen, and no screen to anything else", () => {
    // Spelled out here as well as asserted at module load in the registry, so a
    // future edit that weakens the registry check is still caught.
    const live = new Set(liveTools.map((tool) => tool.slug));
    const screens = new Set<string>(componentSlugs);

    expect([...live].filter((slug) => !screens.has(slug))).toEqual([]);
    expect([...screens].filter((slug) => !live.has(slug))).toEqual([]);
    expect(screens.size).toBe(componentSlugs.length);
  });

  it("only indexes live tools for search", () => {
    const live = new Set(liveTools.map((tool) => tool.slug));
    for (const entry of buildSearchIndex()) {
      expect(live.has(entry.slug)).toBe(true);
    }
  });

  it("keeps every tool description within the documented length", () => {
    // `types.ts` documents 120–160 chars. Only the ceiling is asserted: a short
    // description is a copy decision, but an over-long one is a contract break.
    const tooLong = tools.filter((tool) => tool.description.length > 160).map((tool) => tool.slug);
    expect(tooLong).toEqual([]);
  });

  it("resolves an unknown slug as neither present nor live", () => {
    expect(getTool("definitely-not-a-tool")).toBeUndefined();
    expect(isLive("definitely-not-a-tool")).toBe(false);
  });
});
