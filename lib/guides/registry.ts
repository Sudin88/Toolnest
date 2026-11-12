import { imageGuides } from "@/lib/guides/definitions/image";
import { pdfGuides } from "@/lib/guides/definitions/pdf";
import type { Guide, GuideTopic } from "@/lib/guides/types";
import { liveTools } from "@/lib/tools/registry";

/**
 * The guides registry, the single source of truth for the editorial layer.
 * The index, the routes, the table of contents, the sitemap and the structured
 * data are all derived from this list, so adding a guide here is the whole job.
 */
export const guides: Guide[] = [...pdfGuides, ...imageGuides];

const bySlug = new Map(guides.map((guide) => [guide.slug, guide]));

// Fail loudly at build time rather than shipping a broken route.
if (bySlug.size !== guides.length) {
  const seen = new Set<string>();
  const duplicates = guides
    .map((guide) => guide.slug)
    .filter((slug) => (seen.has(slug) ? true : (seen.add(slug), false)));
  throw new Error(`Duplicate guide slug(s) in the registry: ${duplicates.join(", ")}`);
}

// A guide whose call to action points at a tool that does not exist is worse
// than no guide, so the reference is checked at load time rather than trusted.
{
  const liveSlugs = new Set(liveTools.map((tool) => tool.slug));
  const broken = guides.flatMap((guide) => {
    const referenced = [...guide.tools, ...guide.sections.map((section) => section.tool)];
    return referenced
      .filter((slug): slug is string => Boolean(slug))
      .filter((slug) => !liveSlugs.has(slug))
      .map((slug) => `${guide.slug} -> ${slug}`);
  });

  if (broken.length > 0) {
    throw new Error(
      `Guides point at tools that are not live: ${broken.join(", ")}. ` +
        "Fix the slug or promote the tool to \"live\".",
    );
  }
}

export const guideTopics: GuideTopic[] = ["PDF", "Images"];

export function getGuide(slug: string): Guide | undefined {
  return bySlug.get(slug);
}

export function guidesInTopic(topic: GuideTopic): Guide[] {
  return guides.filter((guide) => guide.topic === topic);
}

/**
 * Every word a reader actually sees, so the reading estimate is honest about
 * short guides rather than assuming a length.
 */
function guideWords(guide: Guide): number {
  const parts = [
    guide.title,
    ...guide.intro,
    ...guide.sections.flatMap((section) => [
      section.heading,
      ...(section.body ?? []),
      ...(section.steps ?? []),
      ...(section.bullets ?? []),
    ]),
    ...(guide.faqs ?? []).flatMap((faq) => [faq.q, faq.a]),
  ];

  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

/** Rounded up, at the conventional 200 words per minute. */
export function guideReadingMinutes(guide: Guide): number {
  return Math.max(1, Math.ceil(guideWords(guide) / 200));
}
