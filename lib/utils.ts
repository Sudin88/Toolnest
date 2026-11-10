import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1_234_567 -> "1,234,567" */
export function formatNumber(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(value);
}

/** 1536 -> "1.5 KB" */
export function formatBytes(bytes: number, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  // `decimals` is a count of digits to show, not the value to print. Printing it
  // directly reported 612 bytes as "0 B" and 2 KB as "1 KB". Rounding the fixed
  // string through Number also drops a pointless trailing ".0".
  const fixed = value < 10 ? String(Number(value.toFixed(decimals))) : String(Math.round(value));
  return `${fixed} ${units[exponent]}`;
}

/** Reduce any input to a URL-safe slug. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
