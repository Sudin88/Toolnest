/**
 * PDF helpers shared by the seven PDF tools.
 *
 * The validation, page-range parsing, rotation and watermark-placement
 * functions are pure: they hold the arithmetic and the user-facing error
 * messages, so they are unit-tested without a browser. The document operations
 * at the bottom use pdf-lib, which is isomorphic, so they are tested against
 * real generated PDFs as well.
 *
 * Everything runs in the visitor's tab. pdf-lib reads the bytes, the new
 * document is assembled in memory, and only the download touches the disk. No
 * document is ever uploaded, which is why every PDF tool can say so.
 */

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

import { formatBytes } from "@/lib/utils";

/** PDF points are 1/72 inch. */
export const MM_TO_PT = 72 / 25.4;

/** Every PDF begins with this in the first 1,024 bytes, whatever its producer. */
export const PDF_MAGIC = "%PDF-";

/** Guards against a single file, a stack of files, or a document eating the tab. */
export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_PDF_FILES = 20;
export const MAX_PDF_PAGES = 3_000;

/** Each image becomes a page, so the cap is on pages as much as on files. */
export const MAX_IMAGES_TO_PDF = 60;

/** A PDF page box may not exceed 14,400 pt (200 in) on either side. */
export const PDF_PAGE_MAX_PT = 14_400;

export const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/* ------------------------------------------------------------- validation */

/**
 * A PDF's first bytes are its real identity, so the magic number is checked
 * rather than the extension or the browser's MIME guess — neither of which a
 * renamed file or a misconfigured server can be trusted to get right.
 */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes(PDF_MAGIC);
}

/**
 * The cheap gate a file must pass before anything is read. It checks the
 * extension, the size and emptiness; the magic bytes are verified once the file
 * has been read, because they are the only part that cannot be faked by a name.
 */
export function validatePdfFile(file: File): string | null {
  if (!/\.pdf$/i.test(file.name)) {
    return `“${file.name}” is not a PDF. Only .pdf files are accepted.`;
  }
  if (file.size === 0) {
    return `“${file.name}” is empty.`;
  }
  if (file.size > MAX_PDF_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}, larger than the ${formatBytes(MAX_PDF_BYTES)} limit for one file. Split it first, or use a smaller file.`;
  }
  return null;
}

/* -------------------------------------------------------------- page ranges */

export interface PageRangeResult {
  /** 1-based page numbers, in the order written, duplicates kept. */
  pages: number[];
  /** One readable sentence per token that could not be used. */
  errors: string[];
}

/**
 * Read a human page list such as `1-3, 7, 10-12`.
 *
 * Order and duplicates are preserved because Extract PDF Pages promises that
 * naming a page twice copies it, and that the output follows the order written.
 * Anything outside the document is reported rather than dropped silently — a
 * range that quietly does nothing is worse than a message saying why.
 */
export function parsePageRanges(input: string, total: number): PageRangeResult {
  const pages: number[] = [];
  const errors: string[] = [];
  const tokens = input.split(/[\s,]+/).filter(Boolean);

  for (const token of tokens) {
    const match = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(token);
    if (!match) {
      errors.push(`“${token}” is not a page number or a range like 3 or 4-7.`);
      continue;
    }

    let start = Number(match[1]);
    let end = match[2] ? Number(match[2]) : start;
    if (start > end) [start, end] = [end, start];

    if (start < 1) {
      errors.push(`Page numbers start at 1, so “${token}” cannot be used.`);
      continue;
    }
    if (start > total) {
      errors.push(
        `${total === 1 ? "This document has 1 page" : `This document has ${total} pages`}, so “${token}” is out of range.`,
      );
      continue;
    }
    if (end > total) {
      errors.push(
        `${total === 1 ? "This document has 1 page" : `This document has ${total} pages`}, so “${token}” is out of range.`,
      );
    }

    for (let page = start; page <= Math.min(end, total); page += 1) pages.push(page);
  }

  return { pages, errors };
}

/** "report.final.pdf" -> "report.final", for building a download name. */
export function fileStem(name: string): string {
  const trimmed = name.replace(/\.[^./\\]+$/, "");
  return trimmed || "document";
}

/** Unique page numbers in ascending order, for split groups where order is fixed. */
export function normalisePages(pages: number[]): number[] {
  return [...new Set(pages)].sort((a, b) => a - b);
}

/**
 * Split a page list into fixed-size chunks: every 5 pages, or one file per page
 * when the size is 1. The last chunk is short rather than padded.
 */
export function chunkEvery(total: number, size: number): number[][] {
  const step = Math.max(1, Math.floor(size));
  const groups: number[][] = [];
  for (let start = 1; start <= total; start += step) {
    const group: number[] = [];
    for (let page = start; page < start + step && page <= total; page += 1) group.push(page);
    groups.push(group);
  }
  return groups;
}

/**
 * A page list written as several groups, one file each — `1-3; 4; 5-8`, or the
 * same with newlines. Each group is read by `parsePageRanges`, so errors are
 * reported per group and the pages within a file are always ascending and unique.
 */
export function parseGroupedRanges(
  input: string,
  total: number,
): { groups: number[][]; errors: string[] } {
  const groups: number[][] = [];
  const errors: string[] = [];
  for (const chunk of input.split(/[;\n]+/)) {
    if (!chunk.trim()) continue;
    const result = parsePageRanges(chunk, total);
    errors.push(...result.errors);
    if (result.pages.length > 0) groups.push(normalisePages(result.pages));
  }
  return { groups, errors };
}

/* --------------------------------------------------------------- rotation */

export function normaliseAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export type Orientation = "portrait" | "landscape" | "square" | "mixed";

export function orientationOf(width: number, height: number): Exclude<Orientation, "mixed"> {
  if (Math.abs(width - height) < 1) return "square";
  return width > height ? "landscape" : "portrait";
}

/* -------------------------------------------------------------- watermark */

export interface TextPlacement {
  x: number;
  y: number;
  rotate: number;
}

/**
 * Where to anchor a rotated text run so its centre sits on the page's centre.
 *
 * pdf-lib rotates a run about the point it is drawn from, not about its middle,
 * so the anchor has to be moved back by half the run's rotated offset. Without
 * this a diagonal watermark drifts into a corner.
 */
export function centredTextPlacement(
  pageW: number,
  pageH: number,
  textW: number,
  textH: number,
  rotationDeg: number,
): TextPlacement {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const offsetX = (textW * cos - textH * sin) / 2;
  const offsetY = (textW * sin + textH * cos) / 2;
  return { x: pageW / 2 - offsetX, y: pageH / 2 - offsetY, rotate: rotationDeg };
}

/* ---------------------------------------------------------- page geometry */

export type ImagePageSize = "a4" | "letter" | "match";
export type ImageOrientation = "portrait" | "landscape" | "auto";
export type ImageFit = "contain" | "fill";

export interface ImagePageGeometry {
  pageW: number;
  pageH: number;
  drawW: number;
  drawH: number;
  x: number;
  y: number;
  /** True when the image is scaled past the page and its edges are cropped. */
  cropped: boolean;
}

/**
 * Where one image sits on the page it will be drawn onto.
 *
 * This is the arithmetic behind Images to PDF, kept out of the component so the
 * four combinations that actually go wrong — a portrait photo on a landscape
 * page, a huge phone photo on A4, "fill" cropping an edge, a margin larger than
 * the page — can be asserted in a unit test rather than eyeballed.
 */
export function imagePageGeometry({
  imageWidth,
  imageHeight,
  pageSize,
  orientation,
  fit,
  marginMm,
}: {
  imageWidth: number;
  imageHeight: number;
  pageSize: ImagePageSize;
  orientation: ImageOrientation;
  fit: ImageFit;
  /** Millimetres, applied to every edge. */
  marginMm: number;
}): ImagePageGeometry {
  const width = Math.max(1, imageWidth);
  const height = Math.max(1, imageHeight);
  // "Match the image exactly" means exactly that, so the margin is not applied —
  // which is also what the tool's own hint promises.
  const marginPt = pageSize === "match" ? 0 : Math.max(0, marginMm) * MM_TO_PT;

  let pageW: number;
  let pageH: number;
  if (pageSize === "match") {
    // The page is the image, shrunk only if it would exceed the PDF page box.
    const shrink = Math.min(1, PDF_PAGE_MAX_PT / Math.max(width, height));
    pageW = width * shrink;
    pageH = height * shrink;
  } else {
    const base = PAGE_SIZES[pageSize];
    const wantsLandscape =
      orientation === "landscape" || (orientation === "auto" && width > height);
    pageW = wantsLandscape ? base.height : base.width;
    pageH = wantsLandscape ? base.width : base.height;
  }

  const availableW = Math.max(1, pageW - marginPt * 2);
  const availableH = Math.max(1, pageH - marginPt * 2);
  const scale =
    fit === "contain"
      ? Math.min(availableW / width, availableH / height)
      : Math.max(availableW / width, availableH / height);
  const drawW = width * scale;
  const drawH = height * scale;

  return {
    pageW,
    pageH,
    drawW,
    drawH,
    x: (pageW - drawW) / 2,
    y: (pageH - drawH) / 2,
    cropped: fit === "fill" && (drawW > availableW + 0.5 || drawH > availableH + 0.5),
  };
}

/* ------------------------------------------------------------- documents */

/** The one friendly-error wrapper every tool loads a document through. */
export async function loadPdfDocument(bytes: Uint8Array): Promise<PDFDocument> {
  if (!looksLikePdf(bytes)) {
    throw new Error("That file does not look like a PDF — the %PDF- header is missing.");
  }
  try {
    const doc = await PDFDocument.load(bytes);
    // pdf-lib parses a truncated or damaged file leniently and only fails when
    // the page tree is touched, which would otherwise surface an internal
    // message to the visitor. Reading the page count here means the failure is
    // caught and explained in our own words.
    doc.getPageCount();
    return doc;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (/encrypt|password|decrypt/i.test(message)) {
      throw new Error(
        "That PDF is password-protected. Remove the password first — an encrypted file cannot be opened here.",
      );
    }
    throw new Error(
      "The PDF could not be read. It may be corrupt, or use a feature this tool does not support.",
    );
  }
}

export interface PdfEntry {
  name: string;
  bytes: Uint8Array;
}

export async function pdfPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await loadPdfDocument(bytes);
  return doc.getPageCount();
}

export async function mergePdfs(entries: PdfEntry[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const entry of entries) {
    const source = await loadPdfDocument(entry.bytes);
    const pages = await out.copyPages(source, source.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return out.save();
}

/** Copy the given 1-based pages from one document into a fresh one. */
export async function copyPagesToNewDocument(
  bytes: Uint8Array,
  pages: number[],
): Promise<Uint8Array> {
  const source = await loadPdfDocument(bytes);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    source,
    pages.map((page) => page - 1),
  );
  for (const page of copied) out.addPage(page);
  return out.save();
}

/** A whole-document rotation: `rotations[i]` is added to page `i`'s own angle. */
export async function rotatePdf(bytes: Uint8Array, rotations: number[]): Promise<Uint8Array> {
  const doc = await loadPdfDocument(bytes);
  doc.getPages().forEach((page, index) => {
    const delta = rotations[index] ?? 0;
    if (delta === 0) return;
    page.setRotation(degrees(normaliseAngle(page.getRotation().angle + delta)));
  });
  return doc.save();
}

export interface WatermarkOptions {
  text: string;
  /** Font size in points. */
  size: number;
  /** 0–1. */
  opacity: number;
  rotationDeg: number;
  /** 0–1 channel triple. */
  color: { r: number; g: number; b: number };
  /** 1-based pages to mark; omitted means every page. */
  pages?: number[];
}

export async function watermarkPdf(
  bytes: Uint8Array,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const textW = font.widthOfTextAtSize(options.text, options.size);
  const target = options.pages ? new Set(options.pages) : null;

  doc.getPages().forEach((page, index) => {
    if (target && !target.has(index + 1)) return;
    const { width, height } = page.getSize();
    const placement = centredTextPlacement(width, height, textW, options.size, options.rotationDeg);
    page.drawText(options.text, {
      x: placement.x,
      y: placement.y,
      size: options.size,
      font,
      color: rgb(options.color.r, options.color.g, options.color.b),
      opacity: options.opacity,
      rotate: degrees(placement.rotate),
    });
  });

  return doc.save();
}

/* --------------------------------------------------------------- inspection */

export interface PageSize {
  width: number;
  height: number;
}

export interface PdfSummary {
  pageCount: number;
  sizes: PageSize[];
  orientation: Orientation;
  mixedSizes: boolean;
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: Date | null;
}

/** Read-only facts about a document — used by PDF Page Counter and page previews. */
export async function summarisePdf(bytes: Uint8Array): Promise<PdfSummary> {
  const doc = await loadPdfDocument(bytes);
  const sizes: PageSize[] = doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return { width, height };
  });

  const orientations = new Set(sizes.map(({ width, height }) => orientationOf(width, height)));
  const first = sizes[0];
  const mixedSizes =
    first !== undefined &&
    sizes.some(
      ({ width, height }) =>
        Math.abs(width - first.width) > 1 || Math.abs(height - first.height) > 1,
    );

  const created = doc.getCreationDate();

  return {
    pageCount: sizes.length,
    sizes,
    orientation: orientations.size > 1 ? "mixed" : (first ? orientationOf(first.width, first.height) : "square"),
    mixedSizes,
    title: doc.getTitle() ?? null,
    author: doc.getAuthor() ?? null,
    subject: doc.getSubject() ?? null,
    creator: doc.getCreator() ?? null,
    producer: doc.getProducer() ?? null,
    creationDate: created ?? null,
  };
}
