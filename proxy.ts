import { NextResponse } from "next/server";

import { adsEnabled } from "@/lib/site";

/**
 * The Content Security Policy, which is the one header that depends on runtime
 * configuration and so cannot live in `next.config.ts`.
 *
 * - `'unsafe-inline'` is required in `script-src` because the App Router emits
 *   its hydration and flight data as inline scripts. A nonce would work, but it
 *   forces every page to render dynamically, which would throw away the static
 *   prerender the whole site is built on. `'unsafe-eval'` is added only during
 *   development, where the bundler needs it.
 * - The AdSense hosts are allowed only when a real publisher id is configured,
 *   so an unconfigured deploy ships a tighter policy than one that shows ads.
 *   They are named individually — never `*.google.com`, which would also allow
 *   every user-content subdomain.
 * - Fonts are self-hosted, scripts are same-origin, and there is no server
 *   endpoint, so `connect-src` stays `'self'`.
 *
 * The other security headers (nosniff, frame options, referrer policy,
 * permissions policy, HSTS) apply to static assets as well, so they are emitted
 * from `next.config.ts` where they cover every route.
 */
const ADS_SCRIPT = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.gstatic.com",
  "https://fundingchoicesmessages.google.com",
  // AdSense checks its traffic for invalid clicks from this family, and it
  // fetches a script as well as a beacon. Blocking the script tells Google the
  // traffic could not be verified, which is the wrong answer to give a reviewer.
  "https://*.adtrafficquality.google",
];
const ADS_IMG = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.gstatic.com",
  "https://*.googleusercontent.com",
];
const ADS_CONNECT = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.gstatic.com",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
];
const ADS_FRAME = [
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://fundingchoicesmessages.google.com",
];

function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV !== "production";
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), ...(adsEnabled ? ADS_SCRIPT : [])];
  const imgSrc = ["'self'", "data:", "blob:", ...(adsEnabled ? ADS_IMG : [])];
  const connectSrc = ["'self'", ...(adsEnabled ? ADS_CONNECT : [])];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${adsEnabled ? ADS_FRAME.join(" ") : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}

export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  return response;
}

export const config = {
  matcher: [
    // Everything except the generated assets and files served as-is.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
};
