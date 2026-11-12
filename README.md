# AllTools

A directory of **35 browser tools** — PDF, image, text, calculator, developer
and daily utilities — built on one promise: **the file never leaves your tab**.

There is no account, no upload and no processing server. A PDF is merged with
`pdf-lib`, an image is decoded with the Canvas API, and every calculation runs in
the same page you are looking at. Close the tab and nothing is left behind.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, Turbopack |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4, self-hosted Inter, light theme only |
| PDF | `pdf-lib`, `jszip` for multi-file archives |
| Images | Canvas / `createImageBitmap` |
| Tests | Vitest over the pure tool logic; browser flows verified manually |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |

## Getting started

Requires **Node.js 20.9 or newer**.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run preview` | Build for Cloudflare and serve the real worker locally |
| `npm run deploy` | Build and deploy the worker to Cloudflare |
| `npm run upload` | Build and upload without promoting to live traffic |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` from `wrangler.jsonc` |

## Architecture

The registry is the single source of truth, and everything else is derived from
it, so the site cannot advertise a tool that has not been built.

```
lib/tools/registry.ts        # lookup + derived lists (live tools, categories, related)
lib/tools/definitions/*.ts   # one file per category; each tool's copy, FAQ, metadata
lib/tools/categories.ts      # category identity used by nav, pages and the sitemap
components/tools/tool-host.tsx   # maps a slug to its implementation
components/tools/impl/*.tsx      # the 35 tool UIs
lib/*.ts                     # pure, testable logic (PDF, image, text, calc, …)
```

A tool is defined once as a `ToolDefinition`. Its page, metadata, JSON-LD,
breadcrumbs, sitemap entry and index listing are all generated from that one
object. A tool marked `status: "planned"` is never linked, never indexed and
never added to the sitemap — `notFound()` is what a planned slug resolves to.
Tool pages are statically prerendered, and only the interactive workbench is a
client component.

## Privacy model

These claims are true of the implementation, not aspirational:

- **No upload endpoint.** There is no API route and no `fetch` in application
  code; the only third-party request the site can make is the AdSense loader,
  and only when a real publisher id is configured.
- **Files are validated before use** — extension, size, file count and, for
  PDFs, page count. Browser-supplied MIME types are never trusted.
- **Object URLs are revoked** when a result is replaced or the tool is closed.
- **Nothing is logged off-device.** There is no analytics tag and no `console.*`
  in application code.
- **Strict security headers**, including a Content Security Policy built from the
  deployment's own configuration, are applied in `proxy.ts`. Ad hosts are only
  allowed when ads are actually enabled.

The privacy, cookie and terms pages describe this behaviour in plain English and
are written to match the code.

## Testing

```bash
npm test
```

Unit tests cover the pure logic that is easy to get subtly wrong: PDF page-range
parsing and geometry, byte formatting, and the helpers shared by the tools. The
`lib/pdf.ts` module keeps its pure helpers separate from its `pdf-lib` calls
precisely so they can run in Node without a browser.

PDF output was additionally verified end to end in a real browser: every one of
the seven PDF tools was driven through the UI and its downloaded file re-opened
with `pdf-lib` to confirm page count, page order and page geometry.

## Deployment — Cloudflare Workers

The site is deployed as a single Worker using the OpenNext Cloudflare adapter.
Every page is prerendered, so there is no database, no queue and no R2 bucket to
provision — the incremental cache is the Worker's own static asset store.

### 1. Configure environment

All three variables are **build-time**. Next.js inlines `NEXT_PUBLIC_*` during
the build, so they must be set in the environment that runs `npm run deploy`,
not just at runtime.

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public origin. Drives canonical URLs, the sitemap and social previews. Falls back to an RFC 2606 reserved domain, so an unconfigured deploy can never emit someone else's URL. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher id (`ca-pub-…`). Ads are off everywhere until this is a real id. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address shown on the contact page. The mailto link is hidden until it is set. |

### 2. Preview the real worker

```bash
npx wrangler login          # once
npm run preview
```

This runs the production build, adapts it for Workers, and serves it through
`wrangler dev` — the same runtime and the same worker bundle that will be
deployed.

### 3. Deploy

```bash
npm run deploy
```

The worker is named `toolnest` (see `wrangler.jsonc`) and is served at
`https://toolnest.<your-subdomain>.workers.dev` until a custom domain is attached.

### 4. Custom domain and HTTPS

Add the route to `wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "alltools.example.com", "custom_domain": true }]
```

Cloudflare provisions the certificate and redirects HTTP to HTTPS automatically.
Then set `NEXT_PUBLIC_SITE_URL` to that origin and redeploy so canonical URLs and
the sitemap match.

### Caching and cost

`open-next.config.ts` uses the static-assets incremental cache, which is correct
here because nothing revalidates at runtime. The trade-off is that the cache is
read-only, so the adapter logs one `Failed to set to read-only cache` line per
route per isolate while Next tries to write back a page it just served. Those
lines are expected and do not affect responses.

On the Workers free plan this fits comfortably: static assets are free and
unlimited, and every page is served from the edge.

## Known limitations

- **Cache Components is disabled.** With `cacheComponents: true` the OpenNext
  worker hangs on every App Router route on Cloudflare and answers 500 — see
  [opennextjs-cloudflare#1450](https://github.com/opennextjs/opennextjs-cloudflare/issues/1450)
  and [vercel/next.js#94880](https://github.com/vercel/next.js/issues/94880).
  Nothing in the app needs it, so `next.config.ts` turns it off and every route
  stays fully prerendered. The reason is documented in that file; re-test before
  re-enabling.
- **No Web Workers.** PDF work runs on the main thread behind a visible busy
  state and explicit size and page limits. Moving it off-thread is a future
  improvement, not something the current tools need at their limits.
- **Light theme only.** The interface is pure white with self-hosted Inter by
  design; there is no dark mode.
- **Chromium-verified.** The tools were tested in Chromium. Firefox and Safari
  are expected to work but have not been verified in this environment.
