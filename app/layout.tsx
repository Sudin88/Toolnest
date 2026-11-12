import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { adsEnabled, adsenseLoaderUrl, siteConfig, socialImage } from "@/lib/site";

import "./globals.css";

/**
 * One self-hosted family. Inter carries every surface — headings, body, labels
 * and numbers — so the site has a single voice. The file is copied from
 * `@fontsource` into `app/fonts/`, so a build makes no request anywhere,
 * including Google. Monospaced surfaces (code, JSON, kbd) use the plain system
 * stack, which costs no download.
 */
const inter = localFont({
  src: [
    { path: "./fonts/inter-variable.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/inter-variable-italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // Deliberately hand-tuned rather than derived from `lib/tools/categories.ts`:
  // these are terms for the root document, so the wording is the target ("online
  // calculators", not the category name "Calculators"), and the list is short
  // enough to keep in step by hand.
  keywords: [
    "free online tools",
    "pdf tools",
    "image tools",
    "text tools",
    "online calculators",
    "developer tools",
  ],
  category: "utilities",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name}: ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name}: ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [socialImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Proves domain ownership to AdSense without a separate verification file,
  // and only when a real publisher id is configured.
  ...(adsEnabled ? { other: { "google-adsense-account": siteConfig.adsenseClient } } : {}),
  // Search Console's URL-prefix verification, emitted only once the token from
  // the property's "HTML tag" method is configured.
  ...(siteConfig.googleSiteVerification
    ? { verification: { google: siteConfig.googleSiteVerification } }
    : {}),
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // The whole site is light: canvas is pure white, so the browser chrome matches.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} flex min-h-full flex-col`}>
        <a
          href="#main"
          className="sr-only rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* The AdSense loader only exists when a real publisher id is set, so an
            unconfigured deploy makes no third-party request at all. */}
        {adsEnabled ? (
          <Script
            id="adsbygoogle-loader"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={adsenseLoaderUrl() ?? undefined}
          />
        ) : null}
      </body>
    </html>
  );
}
