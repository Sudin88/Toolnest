/**
 * Single source of truth for site-wide identity and URLs.
 *
 * `NEXT_PUBLIC_SITE_URL` must be set to the real origin before deploying —
 * canonical URLs, the sitemap, and social previews are all derived from it.
 * The fallback is an RFC 2606 reserved domain so an unconfigured deploy can
 * never accidentally emit someone else's live URL.
 */
export const siteConfig = {
  name: "ToolNest",
  tagline: "One destination. Every tool you need.",
  description:
    "Free online tools that run in your browser. Convert, compress, calculate and create — no account, no upload, no waiting.",
  url: (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://toolnest.example.com"),
  locale: "en_US",
  localeShort: "en",
  /** AdSense publisher id (e.g. "ca-pub-0000000000000000"). Ads stay off until set. */
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "",
  /** Shown on the contact page. Hidden entirely until a real address is set. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "",
} as const;

export const adsEnabled = siteConfig.adsenseClient.startsWith("ca-pub-");

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Where the product talks about itself. Kept in one place so the footer,
 * the About page and the sitemap never drift apart.
 */
export const primaryNav = [
  { label: "PDF", href: "/categories/pdf-tools" },
  { label: "Image", href: "/categories/image-tools" },
  { label: "Text", href: "/categories/text-tools" },
  { label: "Calculators", href: "/categories/calculators" },
  { label: "Developer", href: "/categories/developer-tools" },
] as const;

export const secondaryNav = [
  { label: "All tools", href: "/tools" },
  { label: "Daily tools", href: "/categories/daily-tools" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const legalNav = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
] as const;
