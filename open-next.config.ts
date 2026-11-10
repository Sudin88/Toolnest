import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Every page on ToolNest is prerendered at build time and nothing revalidates:
 * the tools run in the browser, the registry is static, and the sitemap carries
 * a hand-written date rather than `new Date()`. That means the incremental cache
 * can be the Workers static asset store — no R2 bucket, no KV namespace, no
 * queue, and no per-request cache writes to pay for.
 *
 * This cache is read-only by design, so the adapter logs one
 * "Failed to set to read-only cache" line per route per isolate while Next
 * tries to write back a page it just served. Those lines are expected and do
 * not affect responses.
 *
 * If a future feature needs on-demand revalidation, swap this for
 * `r2-incremental-cache` and add the bucket to `wrangler.jsonc`.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: false,
});
