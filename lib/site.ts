/**
 * Single source of truth for site-wide identity and URLs.
 *
 * `NEXT_PUBLIC_SITE_URL` must be set to the real origin before deploying —
 * canonical URLs, the sitemap, and social previews are all derived from it.
 * The fallback is an RFC 2606 reserved domain so an unconfigured deploy can
 * never accidentally emit someone else's live URL.
 */
/** AdSense publisher ids are always `ca-pub-` followed by exactly 16 digits. */
const ADSENSE_PATTERN = /^ca-pub-\d{16}$/;
/** Deliberately strict: nothing that could break out of a `mailto:` header. */
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const RAW_ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
const RAW_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
/** Search Console's verification token, emitted only once one is configured. */
const RAW_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ?? "";

export const siteConfig = {
  name: "AllTools",
  tagline: "One destination. Every tool you need.",
  description:
    "Free online tools that run in your browser. Convert, compress, calculate and create: no account, no upload, no waiting.",
  url: (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://alltools.example.com"),
  locale: "en_US",
  localeShort: "en",
  /**
   * AdSense publisher id, e.g. "ca-pub-0000000000000000". Ads stay off until a
   * syntactically valid id is set; a malformed one is treated as unset rather
   * than switching ads — and their whole host allowlist — on.
   */
  adsenseClient: ADSENSE_PATTERN.test(RAW_ADSENSE) ? RAW_ADSENSE : "",
  /** Shown on the contact page. Empty unless a plausible address is set. */
  contactEmail: EMAIL_PATTERN.test(RAW_EMAIL) ? RAW_EMAIL : "",
  /** Google Search Console ownership token, or "" when verification is not set up. */
  googleSiteVerification: RAW_VERIFICATION,
} as const;

export const adsEnabled = siteConfig.adsenseClient !== "";

/**
 * The one social card, served from `public/og.png`.
 *
 * It is declared here rather than in `lib/seo.ts` because the root layout needs
 * it as well, and `lib/seo.ts` reaches into the tool registry — which would drag
 * the category icons onto every route for a value that is four numbers.
 */
export const socialImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${siteConfig.name}: ${siteConfig.tagline}`,
} as const;

/** The AdSense loader, with the client id passed as a properly-encoded query. */
export function adsenseLoaderUrl(): string | null {
  if (!adsEnabled) return null;
  const url = new URL("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
  url.searchParams.set("client", siteConfig.adsenseClient);
  return url.toString();
}

/** A safe `mailto:` href for the validated contact address, or null when unset. */
export const contactEmailHref = siteConfig.contactEmail
  ? `mailto:${encodeURIComponent(siteConfig.contactEmail)}`
  : null;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

/**
 * The legal links, kept here because they are their own small set with no
 * registry counterpart. The product navigation — the category strip, the daily
 * link and the header entries — is derived from the registry in `lib/nav.ts`.
 */
export const legalNav = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
] as const;
