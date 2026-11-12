import { describe, expect, it } from "vitest";

import {
  getGuide,
  guideReadingMinutes,
  guides,
  guidesForCategory,
  guidesForTool,
  guidesInTopic,
  guideTopics,
} from "@/lib/guides/registry";
import { liveTools, liveToolsInCategory } from "@/lib/tools/registry";

/**
 * The guides are the editorial layer, and the failure that matters is a guide
 * that routes a reader somewhere that cannot help them: a tool that does not
 * exist, or a section anchor with no heading behind it. Those are asserted here
 * rather than left to the load-time check alone, so a broken guide fails a test
 * with a readable message instead of a stack trace during the build.
 */
describe("guides", () => {
  it("gives every guide a unique slug", () => {
    const slugs = guides.map((guide) => guide.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("covers every topic", () => {
    for (const topic of guideTopics) {
      expect(guidesInTopic(topic).length).toBeGreaterThan(0);
    }
  });

  it("points only at tools that are live", () => {
    const live = new Set(liveTools.map((tool) => tool.slug));

    for (const guide of guides) {
      const referenced = [...guide.tools, ...guide.sections.map((section) => section.tool)].filter(
        (slug): slug is string => Boolean(slug),
      );

      expect(referenced.length).toBeGreaterThan(0);
      for (const slug of referenced) {
        expect(live.has(slug), `${guide.slug} references "${slug}"`).toBe(true);
      }
    }
  });

  it("gives every section a unique id and a heading", () => {
    for (const guide of guides) {
      const ids = guide.sections.map((section) => section.id);

      expect(new Set(ids).size).toBe(ids.length);
      for (const section of guide.sections) {
        expect(section.id).toMatch(/^[a-z0-9-]+$/);
        expect(section.heading.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the meta line inside the length a search result shows", () => {
    for (const guide of guides) {
      expect(guide.metaTitle.length, guide.slug).toBeLessThanOrEqual(60);
      expect(guide.description.length, guide.slug).toBeGreaterThanOrEqual(120);
      expect(guide.description.length, guide.slug).toBeLessThanOrEqual(160);
    }
  });

  it("keeps every guide long enough to be worth a page", () => {
    for (const guide of guides) {
      expect(guide.sections.length, guide.slug).toBeGreaterThanOrEqual(4);
      expect(guideReadingMinutes(guide), guide.slug).toBeGreaterThanOrEqual(3);
    }
  });

  /**
   * A house rule, not a technical one: visitor-facing copy on this site uses no
   * em dashes. The guides are the longest prose surface here, so the rule is
   * asserted rather than trusted to review.
   */
  it("uses no em dashes in visitor-facing copy", () => {
    for (const guide of guides) {
      const copy = [
        guide.title,
        guide.metaTitle,
        guide.description,
        ...guide.intro,
        ...guide.sections.flatMap((section) => [
          section.heading,
          ...(section.body ?? []),
          ...(section.steps ?? []),
          ...(section.bullets ?? []),
        ]),
        ...(guide.faqs ?? []).flatMap((faq) => [faq.q, faq.a]),
      ];

      for (const text of copy) {
        expect(text.includes("\u2014"), `${guide.slug}: ${text}`).toBe(false);
      }
    }
  });

  it("resolves a guide by its slug", () => {
    const first = guides[0];
    expect(getGuide(first.slug)).toBe(first);
    expect(getGuide("no-such-guide")).toBeUndefined();
  });

  /**
   * The reverse links are what turn the guides and the tools into one cluster
   * instead of a one-way funnel into the product, so the derivation is pinned:
   * a tool is only listed against a guide that actually declares it.
   */
  describe("reverse links", () => {
    const declaredTools = (guide: (typeof guides)[number]) =>
      [...guide.tools, ...guide.sections.map((section) => section.tool)].filter(
        (slug): slug is string => Boolean(slug),
      );

    it("lists a tool only against guides that declare it", () => {
      const inbound = guidesForTool("merge-pdf");
      expect(inbound.length).toBeGreaterThan(0);

      for (const guide of inbound) {
        expect(declaredTools(guide)).toContain("merge-pdf");
      }
    });

    it("returns nothing rather than padding a tool no guide writes about", () => {
      const orphan = liveTools.find((tool) => guidesForTool(tool.slug).length === 0);
      expect(orphan, "expected at least one live tool with no guide").toBeDefined();
      expect(guidesForTool(orphan!.slug)).toEqual([]);
    });

    it("gives a category only the guides that reach its own tools", () => {
      const pdf = guidesForCategory("pdf");
      expect(pdf.length).toBeGreaterThan(0);

      const pdfSlugs = new Set(liveToolsInCategory("pdf").map((tool) => tool.slug));
      for (const guide of pdf) {
        expect(declaredTools(guide).some((slug) => pdfSlugs.has(slug)), guide.slug).toBe(true);
      }

      // Nothing is written about the calculator shelf, so its section must not render.
      expect(guidesForCategory("calculators")).toEqual([]);
    });
  });
});
