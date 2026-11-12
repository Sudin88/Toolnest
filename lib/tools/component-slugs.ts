/**
 * The slugs of every implemented tool screen, in one place.
 *
 * `components/tools/tool-host.tsx` types its loader map as a
 * `Record<ComponentSlug, ComponentType>`, so a missing or extra entry there is a
 * type error; `lib/tools/registry.ts` then asserts this list matches the
 * registry's live tools exactly, at build time. Together the two make the
 * slug→component mapping provably exhaustive: a renamed or dropped key can no
 * longer compile, prerender, get linked and indexed and then quietly serve the
 * "not built yet" placeholder.
 *
 * It is a plain module with no imports on purpose — it is the bridge between the
 * registry, which must stay pure data, and the client loader map, which must
 * carry the components. Deriving the list from `Object.keys` of the loader map
 * would drag a `"use client"` module into the registry's import graph.
 */
export const componentSlugs = [
  // Text
  "word-counter",
  "character-counter",
  "case-converter",
  "remove-duplicate-lines",
  "lorem-ipsum-generator",
  "text-compare",
  "url-encoder-decoder",
  // Developer
  "json-formatter",
  "base64-encoder-decoder",
  "uuid-generator",
  "password-generator",
  "url-parser",
  // Calculators
  "percentage-calculator",
  "unit-converter",
  "age-calculator",
  "bmi-calculator",
  "loan-calculator",
  "date-difference-calculator",
  // Daily
  "qr-code-generator",
  "random-number-generator",
  "tip-calculator",
  "stopwatch",
  // Image
  "compress-image",
  "resize-image",
  "convert-image",
  "image-to-pdf",
  "image-color-picker",
  "image-to-base64",
  // PDF
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "extract-pdf-pages",
  "watermark-pdf",
  "images-to-pdf",
  "pdf-page-counter",
] as const;

export type ComponentSlug = (typeof componentSlugs)[number];
