/**
 * Canvas-based image helpers. The image tools all follow the same shape: load a
 * file into an ImageBitmap, draw it to a canvas, then re-encode. Reading and
 * writing happen entirely on the device.
 */

import { formatNumber } from "@/lib/utils";

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  /** MIME type reported by the browser, e.g. "image/jpeg". */
  type: string;
  /** Original filename, used to build a sensible download name. */
  name: string;
  /** Original size in bytes. */
  size: number;
}

/** A file this large is refused before anything is decoded. */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
/** A declared image wider, taller or bigger than this is refused. */
export const MAX_IMAGE_SIDE = 16_384;
export const MAX_IMAGE_PIXELS = 100_000_000;

/**
 * A file's first bytes are its real identity — the extension and the browser's
 * MIME guess can both be wrong for a renamed file — so the format is sniffed
 * from the contents and the guess is only ever a hint.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  const ascii = (offset: number, length: number) =>
    new TextDecoder("latin1").decode(bytes.subarray(offset, offset + length));
  const at = (offset: number, ...codes: number[]) =>
    codes.every((code, index) => bytes[offset + index] === code);

  if (bytes.length < 12) return null;
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (at(0, 0x42, 0x4d)) return "image/bmp";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("mif1")) {
      return "image/heic";
    }
  }
  return null;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1_000000 +
    bytes[offset + 1] * 0x1_0000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

/**
 * The width and height a file declares in its header, read without decoding a
 * single pixel. Knowing this up front is what lets an enormous declared canvas
 * be refused instead of allocated. Returns null for a format it cannot read.
 */
export function declaredDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const type = sniffImageType(bytes);

  if (type === "image/png" && bytes.length >= 24) {
    return { width: readUint32BE(bytes, 16), height: readUint32BE(bytes, 20) };
  }
  if (type === "image/gif" && bytes.length >= 10) {
    return { width: bytes[6] | (bytes[7] << 8), height: bytes[8] | (bytes[9] << 8) };
  }
  if (type === "image/bmp" && bytes.length >= 26) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: Math.abs(view.getInt32(18, true)), height: Math.abs(view.getInt32(22, true)) };
  }
  if (type === "image/webp" && bytes.length >= 30) {
    const chunk = new TextDecoder("latin1").decode(bytes.subarray(12, 16));
    if (chunk === "VP8X") {
      return {
        width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
        height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
      };
    }
    if (chunk === "VP8L") {
      return {
        width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]),
        height: 1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6)),
      };
    }
    if (chunk === "VP8 ") {
      return {
        width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
        height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
      };
    }
  }
  if (type === "image/jpeg") {
    // Walk the marker segments until the frame header, which carries the size.
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2;
        continue;
      }
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          width: (bytes[offset + 7] << 8) | bytes[offset + 8],
          height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        };
      }
      offset += 2 + length;
    }
  }
  return null;
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `That image is ${formatNumber(Math.round(file.size / 1024 / 1024))} MB, larger than the ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit for one file. Resize it first.`,
    );
  }

  // 64 KB is enough for every header we parse, including a JPEG's frame marker.
  const head = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  const sniffed = sniffImageType(head);
  if (!sniffed) {
    throw new Error(
      "That file is not an image the browser can open — its contents do not match a supported format.",
    );
  }

  // Refuse a declared canvas that is too big to decode safely. A tiny file can
  // claim an enormous size, and decoding it at full scale would exhaust memory
  // before any post-decode check could run.
  const declared = declaredDimensions(head);
  if (
    declared &&
    (declared.width > MAX_IMAGE_SIDE ||
      declared.height > MAX_IMAGE_SIDE ||
      declared.width * declared.height > MAX_IMAGE_PIXELS)
  ) {
    throw new Error(
      `That image declares ${formatNumber(declared.width)} × ${formatNumber(declared.height)} pixels, larger than this tool can open. It handles up to ${formatNumber(MAX_IMAGE_SIDE)} pixels a side and ${formatNumber(MAX_IMAGE_PIXELS)} pixels in total.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("The image could not be decoded. It may be corrupt or in an unsupported format.");
  }

  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    type: sniffed,
    name: file.name,
    size: file.size,
  };
}

export function drawToCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  background?: string,
  smoothing: ImageSmoothingQuality = "high",
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser did not provide a 2D canvas context.");

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.imageSmoothingEnabled = smoothing !== "low";
  context.imageSmoothingQuality = smoothing;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`This browser cannot encode ${type}.`));
      },
      type,
      quality,
    );
  });
}

/** "holiday.photo.jpg" -> "holiday.photo" */
export function baseName(name: string) {
  const trimmed = name.replace(/\.[^./\\]+$/, "");
  return trimmed || "image";
}

export const FORMAT_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "image/avif": "AVIF",
  "image/bmp": "BMP",
  "image/svg+xml": "SVG",
};

export function formatLabel(type: string) {
  return FORMAT_LABELS[type] ?? (type.split("/")[1]?.toUpperCase() || "image");
}

/** The ratio between the re-encoded size and the original, e.g. 0.42 for -58%. */
export function savingsRatio(original: number, next: number) {
  if (original <= 0) return 1;
  return next / original;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ colour */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp255 = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => clamp255(channel).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const red = clamp255(r) / 255;
  const green = clamp255(g) / 255;
  const blue = clamp255(b) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Whether a source image is likely to carry transparency, judged from the file
 * type alone. Reading every pixel would be accurate but far too slow for a
 * warning the visitor sees before pressing a button.
 */
export function mayHaveAlpha(type: string) {
  return type === "image/png" || type === "image/webp" || type === "image/gif" || type === "image/svg+xml";
}
