"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * The tools are client-side, interactive and only ever needed one at a time, so
 * each one is loaded on demand. A visitor reading about the loan calculator
 * never downloads the image compressor's canvas code or pdf-lib.
 */

function skeleton() {
  return (
    <div className="panel flex flex-col gap-4 p-5 sm:p-6" role="status" aria-live="polite">
      <span className="sr-only">Loading the tool…</span>
      <div className="h-10 w-full animate-pulse rounded-md bg-surface-3" />
      <div className="h-24 w-full animate-pulse rounded-md bg-surface-3" />
      <div className="h-10 w-40 animate-pulse rounded-md bg-surface-3" />
    </div>
  );
}

const load = (loader: () => Promise<{ default: ComponentType }>) =>
  dynamic(loader, { loading: () => skeleton() });

const COMPONENTS: Record<string, ComponentType> = {
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
};

export function ToolHost({ slug }: { slug: string }) {
  const Component = COMPONENTS[slug];

  if (!Component) {
    return (
      <p className="rounded-md border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-sm text-muted">
        This tool is not available yet. It is on the roadmap and will appear here when it ships.
      </p>
    );
  }

  return <Component />;
}
