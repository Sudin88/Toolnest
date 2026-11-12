import { describe, expect, it } from "vitest";

import { getGuide, guideReadingMinutes, guides, guidesInTopic, guideTopics } from "@/lib/guides/registry";
import { liveTools } from "@/lib/tools/registry";

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
});
