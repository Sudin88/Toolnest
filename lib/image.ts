/**
 * Canvas-based image helpers. The image tools all follow the same shape: load a
 * file into an ImageBitmap, draw it to a canvas, then re-encode. Reading and
 * writing happen entirely on the device.
 */

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

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image the browser can open.");
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
    type: file.type,
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

/** "rgb(12, 34, 56)" and "#abc" both resolve to a channel triple. */
export function parseCssRgb(value: string): Rgb | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const digits = hex[1];
    const full =
      digits.length === 3
        ? digits.split("").map((d) => d + d).join("")
        : digits;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(value);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

/**
 * Whether a source image is likely to carry transparency, judged from the file
 * type alone. Reading every pixel would be accurate but far too slow for a
 * warning the visitor sees before pressing a button.
 */
export function mayHaveAlpha(type: string) {
  return type === "image/png" || type === "image/webp" || type === "image/gif" || type === "image/svg+xml";
}
