import path from "node:path";

import type { NextConfig } from "next";

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
};

export default nextConfig;
