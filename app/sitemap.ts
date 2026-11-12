import type { MetadataRoute } from "next";

import { guides } from "@/lib/guides/registry";
import { absoluteUrl } from "@/lib/site";
import { categories } from "@/lib/tools/categories";
import { countByCategory, liveTools } from "@/lib/tools/registry";

/**
 * Deterministic by design: `new Date()` at build time would make every deploy
 * claim the whole site changed, which is noisy for crawlers and dishonest.
 */
const SITE_UPDATED = new Date("2026-08-20");

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.4, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: SITE_UPDATED,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // A category with nothing working yet is thin content, so it stays out of the
  // sitemap until at least one tool in it ships.
  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((category) => countByCategory(category.id).live > 0)
    .map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: SITE_UPDATED,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const toolEntries: MetadataRoute.Sitemap = liveTools.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: new Date(tool.added),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Guides carry their own review date, so the sitemap reports when the writing
  // was last checked rather than claiming every deploy refreshed it.
  const guideEntries: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.updated),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...categoryEntries, ...toolEntries, ...guideEntries];
}
