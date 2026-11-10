import {
  FaCalculator,
  FaClock,
  FaCode,
  FaFileImage,
  FaFileLines,
  FaFilePdf,
} from "react-icons/fa6";

import type { ToolCategory, ToolCategoryId } from "@/lib/tools/types";

export const categories: ToolCategory[] = [
  {
    id: "pdf",
    slug: "pdf-tools",
    name: "PDF tools",
    navLabel: "PDF",
    tagline: "Merge, split, rotate and stamp documents",
    description:
      "Everyday PDF surgery — combine files, pull out page ranges, rotate scans, add a watermark and count pages. Your document never leaves the browser tab.",
    icon: FaFilePdf,
    color: "#d93025",
    intro:
      "PDF tools handle the jobs that make people install desktop software for a single five-minute task. Everything here runs on pdf-lib inside your browser: you pick the file, the work happens on your device, and you download the result. No queue, no render farm, no document sitting on a server.",
  },
  {
    id: "image",
    slug: "image-tools",
    name: "Image tools",
    navLabel: "Image",
    tagline: "Compress, resize, convert and inspect images",
    description:
      "Compress photos before you email them, resize to an exact pixel size, convert between JPEG, PNG and WebP, pick a colour out of a screenshot, and turn images into base64.",
    icon: FaFileImage,
    color: "#2563eb",
    intro:
      "Photos and screenshots are the files people actually move around, and they are usually far bigger than they need to be. These tools decode your image with the Canvas API, do the work locally, and hand back a smaller or differently shaped file — plus the before and after byte counts so you can see what changed.",
  },
  {
    id: "text",
    slug: "text-tools",
    name: "Text tools",
    navLabel: "Text",
    tagline: "Count, clean, compare and transform text",
    description:
      "Count words and characters, change letter case, strip duplicate lines, compare two drafts side by side, generate placeholder copy and encode or decode URLs.",
    icon: FaFileLines,
    color: "#1f2937",
    intro:
      "Text work is full of small, annoying chores: a word limit to hit, a thousand duplicated rows to collapse, two versions of a paragraph to diff. These tools process as you type, hold no state beyond the tab, and never send your copy anywhere.",
  },
  {
    id: "calculators",
    slug: "calculators",
    name: "Calculators",
    navLabel: "Calculators",
    tagline: "Percentages, dates, loans, health and units",
    description:
      "Work out a percentage change, an exact age in years and days, BMI with the caveat that matters, loan repayments, the gap between two dates, and unit conversions.",
    icon: FaCalculator,
    color: "#b45309",
    intro:
      "Numbers you need once, immediately, without opening a spreadsheet. Each calculator shows its formula as well as its result, so you can check the arithmetic instead of trusting it, and every input is validated before it produces an answer.",
  },
  {
    id: "developer",
    slug: "developer-tools",
    name: "Developer tools",
    navLabel: "Developer",
    tagline: "Format, encode, generate and inspect",
    description:
      "Format and validate JSON, encode and decode base64, generate UUIDs and strong passwords, and break a URL into its component parts.",
    icon: FaCode,
    color: "#0f766e",
    intro:
      "The utilities you reach for twenty times a week. They are built for pasted real-world input, give you an actual error message with a position when something is malformed, and keep secrets — especially generated passwords — on the device.",
  },
  {
    id: "daily",
    slug: "daily-tools",
    name: "Daily tools",
    navLabel: "Daily",
    tagline: "The small things you do most days",
    description:
      "Generate a QR code, pick a random number in a range, split a restaurant bill including the tip, and time something with a proper stopwatch.",
    icon: FaClock,
    color: "#15803d",
    intro:
      "Not everything fits a category. These are the odds and ends — a QR code for a menu, a fair way to pick who goes first, a tip split that does the awkward division for you, and a stopwatch that keeps running while you switch tabs.",
  },
];

export const categoryById = new Map<ToolCategoryId, ToolCategory>(
  categories.map((category) => [category.id, category]),
);

export const categoryBySlug = new Map<string, ToolCategory>(
  categories.map((category) => [category.slug, category]),
);

export function getCategory(id: ToolCategoryId): ToolCategory {
  const category = categoryById.get(id);
  if (!category) throw new Error(`Unknown tool category: ${id}`);
  return category;
}
