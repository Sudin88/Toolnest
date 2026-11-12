import path from "node:path";

import type { NextConfig } from "next";

/**
 * Security headers that do not depend on configuration. They live here, rather
 * than in the middleware, so they cover every response the worker generates,
 * pages included. On the Cloudflare target the static assets in
 * `.open-next/assets` are answered by Cloudflare's asset layer before the worker
 * runs, so these `headers()` never see them; `public/_headers` carries the same
 * list for those responses. Keep the two files in step.
 *
 * The Content Security Policy stays in `proxy.ts` because it changes with the
 * deployment's AdSense configuration.
 *
 * `clipboard-write` is deliberately **not** denied: the copy buttons use the
 * async Clipboard API and denying it would push every copy onto the deprecated
 * `execCommand` path. Reading the clipboard is not a capability any tool needs,
 * so that one is denied.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), fullscreen=(), clipboard-read=(), display-capture=(), idle-detection=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
  // `preload` is omitted on purpose: it is a two-year commitment over every
  // subdomain of the registrable domain, which this project does not own alone.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  /*
   * Cache Components is deliberately OFF.
   *
   * It cannot run on the deployment target: with `cacheComponents: true` the
   * OpenNext Cloudflare worker hangs on every App Router route and answers 500
   * ("the Workers runtime canceled this request because it detected that your
   * Worker's code had hung"). Cache Components depends on Node.js event-loop
   * semantics that workerd does not reproduce — see
   * opennextjs/opennextjs-cloudflare#1450 and vercel/next.js#94880. Verified
   * against @opennextjs/cloudflare 1.20.16, @opennextjs/aws 4.1.15 and
   * next 16.4.6, the latest of each, so there is no released fix to adopt yet.
   *
   * Nothing here needs it: there is no `"use cache"`, no Suspense and no
   * dynamic API, so every route is still fully prerendered — the flag only
   * changes whether the prerender is streamed as a shell. Re-test the issue
   * before turning this back on.
   *
   * `partialPrefetching` requires `cacheComponents`, so it is off with it.
   */
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    // Pin the workspace root so Turbopack does not walk up to a lockfile that
    // lives outside this project.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
