import { adsEnabled, siteConfig } from "@/lib/site";

/**
 * The Authorized Digital Sellers file.
 *
 * AdSense needs it so buyers can confirm this publisher is authorised to sell
 * inventory on this domain. It is derived from the same validated publisher id
 * as the loader, so it can never name a domain or account the site is not
 * actually using. An unconfigured deploy answers 404, which is what Google
 * treats as "no ads.txt present" anyway.
 */
export function GET() {
  if (!adsEnabled) return new Response("Not found", { status: 404 });

  // AdSense ids are written `ca-pub-…`; the ads.txt record drops the `ca-`.
  // The trailing value is Google's own certification authority id.
  const publisher = siteConfig.adsenseClient.replace(/^ca-/, "");
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
