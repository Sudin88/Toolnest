"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useEffect } from "react";
import type { ComponentType } from "react";

import { recordRecent } from "@/lib/recents";
import type { ComponentSlug } from "@/lib/tools/component-slugs";

/**
 * The tools are client-side, interactive and only ever needed one at a time, so
 * each one is loaded on demand. A visitor reading about the loan calculator
 * never downloads the image compressor's canvas code or pdf-lib.
 */

function skeleton() {
  return (
    <div className="panel flex flex-col gap-5 p-5 sm:p-6" role="status" aria-live="polite">
      <span className="sr-only">Loading the tool…</span>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded-sm bg-surface-3" />
        <div className="h-24 w-full animate-pulse rounded-md bg-surface-3" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-10 w-full animate-pulse rounded-md bg-surface-3" />
        <div className="h-10 w-full animate-pulse rounded-md bg-surface-3" />
      </div>
      <div className="h-10 w-32 animate-pulse rounded-md bg-surface-3" />
    </div>
  );
}

const load = (loader: () => Promise<{ default: ComponentType }>) =>
  dynamic(loader, { loading: () => skeleton() });

const COMPONENTS: Record<ComponentSlug, ComponentType> = {
  // Text
  "word-counter": load(() => import("@/components/tools/impl/word-counter")),
  "character-counter": load(() => import("@/components/tools/impl/character-counter")),
  "case-converter": load(() => import("@/components/tools/impl/case-converter")),
  "remove-duplicate-lines": load(() => import("@/components/tools/impl/remove-duplicate-lines")),
  "lorem-ipsum-generator": load(() => import("@/components/tools/impl/lorem-ipsum-generator")),
  "text-compare": load(() => import("@/components/tools/impl/text-compare")),
  "url-encoder-decoder": load(() => import("@/components/tools/impl/url-encoder-decoder")),
  // Developer
  "json-formatter": load(() => import("@/components/tools/impl/json-formatter")),
  "base64-encoder-decoder": load(() => import("@/components/tools/impl/base64-encoder-decoder")),
  "uuid-generator": load(() => import("@/components/tools/impl/uuid-generator")),
  "password-generator": load(() => import("@/components/tools/impl/password-generator")),
  "url-parser": load(() => import("@/components/tools/impl/url-parser")),
  // Calculators
  "percentage-calculator": load(() => import("@/components/tools/impl/percentage-calculator")),
  "unit-converter": load(() => import("@/components/tools/impl/unit-converter")),
  "age-calculator": load(() => import("@/components/tools/impl/age-calculator")),
  "bmi-calculator": load(() => import("@/components/tools/impl/bmi-calculator")),
  "loan-calculator": load(() => import("@/components/tools/impl/loan-calculator")),
  "date-difference-calculator": load(() => import("@/components/tools/impl/date-difference-calculator")),
  // Daily
  "qr-code-generator": load(() => import("@/components/tools/impl/qr-code-generator")),
  "random-number-generator": load(() => import("@/components/tools/impl/random-number-generator")),
  "tip-calculator": load(() => import("@/components/tools/impl/tip-calculator")),
  stopwatch: load(() => import("@/components/tools/impl/stopwatch")),
  // Image
  "compress-image": load(() => import("@/components/tools/impl/compress-image")),
  "resize-image": load(() => import("@/components/tools/impl/resize-image")),
  "convert-image": load(() => import("@/components/tools/impl/convert-image")),
  "image-to-pdf": load(() => import("@/components/tools/impl/image-to-pdf")),
  "image-color-picker": load(() => import("@/components/tools/impl/image-color-picker")),
  "image-to-base64": load(() => import("@/components/tools/impl/image-to-base64")),
  // PDF
  "merge-pdf": load(() => import("@/components/tools/impl/merge-pdf")),
  "split-pdf": load(() => import("@/components/tools/impl/split-pdf")),
  "rotate-pdf": load(() => import("@/components/tools/impl/rotate-pdf")),
  "extract-pdf-pages": load(() => import("@/components/tools/impl/extract-pdf-pages")),
  "watermark-pdf": load(() => import("@/components/tools/impl/watermark-pdf")),
  "images-to-pdf": load(() => import("@/components/tools/impl/images-to-pdf")),
  "pdf-page-counter": load(() => import("@/components/tools/impl/pdf-page-counter")),
};

export function ToolHost({ slug }: { slug: string }) {
  // Opening a tool is what "recently used" means, so it is recorded here rather
  // than on the page, which is a server component and has no storage access.
  useEffect(() => {
    recordRecent(slug);
  }, [slug]);

  const Component = COMPONENTS[slug as ComponentSlug];

  // The registry only routes `live` tools, and the build asserts every live slug
  // has a screen here, so a miss means the mapping drifted. Render the 404 rather
  // than a placeholder that hides it.
  if (!Component) notFound();

  return <Component />;
}
