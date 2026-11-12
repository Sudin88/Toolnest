import type { Metadata } from "next";

import { absoluteUrl, siteConfig, socialImage } from "@/lib/site";
import { getCategory } from "@/lib/tools/categories";
import type { Faq, ToolDefinition } from "@/lib/tools/types";

/**
 * Builds a complete, self-consistent metadata block. Every page calls this so
 * title, description, canonical and og:url can never disagree.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noIndex = false,
}: {
  title: string;
  description: string;
  /** Root-relative path, e.g. "/tools/merge-pdf". */
  path: string;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const socialTitle = `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: absoluteUrl(path),
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage.url],
    },
  };
}

/**
 * The brand as an entity, so a search engine can attach the name to the site
 * instead of inferring it page by page. `logo` is the square app icon rendered
 * to PNG: structured data wants a raster logo, and the favicon is an SVG.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: absoluteUrl("/logo.png"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.localeShort,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/**
 * Describes a tool as a free web application. Deliberately does not include
 * aggregateRating or review — we have no real reviews, and inventing them is
 * both inaccurate and against Google's structured data policy.
 */
export function toolJsonLd(tool: ToolDefinition) {
  const category = getCategory(tool.category);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} | ${siteConfig.name}`,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: category.name,
    operatingSystem: "Any modern web browser",
    url: absoluteUrl(`/tools/${tool.slug}`),
    description: tool.description,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: tool.howTo ?? [],
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
