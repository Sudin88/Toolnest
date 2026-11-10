import { NextResponse } from "next/server";

import { adsEnabled } from "@/lib/site";

/**
 * Baseline security headers for every page.
 *
 * The Content Security Policy is deliberately conservative and is built from
 * the deployment's own configuration:
 *
 * - `'unsafe-inline'` is required in `script-src` because the App Router emits
 *   its hydration and flight data as inline scripts. A nonce would work, but it
 *   forces every page to render dynamically, which would throw away the static
 *   prerender the whole site is built on. `'unsafe-eval'` is added only during
 *   development, where the bundler needs it.
 * - The AdSense hosts are only allowed when a real publisher id is configured,
 *   so an unconfigured deploy ships a tighter policy than one that shows ads.
 * - Fonts are self-hosted, scripts are same-origin, and there is no server
 *   endpoint, so `connect-src` stays `'self'`.
 *
 * `frame-ancestors` mirrors the X-Frame-Options header rather than replacing it,
 * since older browsers only understand the header.
 */
const ADS_SCRIPT = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.google.com",
  "https://*.gstatic.com",
];
const ADS_IMG = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://*.googleusercontent.com",
];
const ADS_CONNECT = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://ep1.adtrafficquality.google",
];
const ADS_FRAME = [
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.google.com",
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
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // No tool asks for a camera, microphone or location, so nothing may.
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // "allow-popups" keeps ad and share popups working while still isolating us.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  return response;
}

export const config = {
  matcher: [
    // Everything except the generated assets and files served as-is.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
};
