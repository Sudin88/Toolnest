import { Dices, QrCode, Receipt, Timer } from "lucide-react";

import type { ToolDefinition } from "@/lib/tools/types";

export const dailyTools: ToolDefinition[] = [
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    category: "daily",
    tagline: "Create a QR code for a link, text or Wi-Fi",
    description:
      "Generate a QR code from a URL, plain text, contact details or Wi-Fi credentials, with size and colour options and a PNG download.",
    icon: QrCode,
    keywords: ["qr code generator", "create qr code", "wifi qr code", "free qr code png"],
    local: true,
    status: "live",
    rank: 92,
    added: "2026-08-16",
    howTo: [
      "Choose what you are encoding — a URL, plain text, or Wi-Fi credentials, which need a specific format to work.",
      "Type the content and watch the preview regenerate as you go.",
      "Set the output size and quiet-zone margin. Scanners need that clear border, so do not remove it.",
      "Download the PNG. It is generated in the browser and never expires, because no redirect service sits behind it.",
    ],
    faqs: [
      {
        q: "Will the QR code expire?",
        a: "No. The code encodes your content directly rather than pointing at a shortener, so it keeps working for as long as the destination does — and if you print it, nothing can switch it off.",
      },
      {
        q: "What error-correction level should I use?",
        a: "Medium is the right default. Higher levels survive more damage and stay readable when printed small or partly obscured, at the cost of a denser pattern that is slightly harder to scan.",
      },
      {
        q: "Can I use the PNG commercially?",
        a: "Yes. The image is yours, with no watermark and no attribution requirement.",
      },
    ],
    limits: [
      "There is a capacity ceiling — a few thousand characters at the lowest error-correction level, much less at the highest.",
      "The output is a flat PNG with no vector or SVG export, and no logo or colour artwork baked in.",
      "It renders text and URLs; Wi-Fi, vCard and payment formats are not generated.",
    ],
  },
  {
    slug: "random-number-generator",
    name: "Random Number Generator",
    category: "daily",
    tagline: "Fair random numbers in any range",
    description:
      "Generate one or many random integers or decimals within a range you set, using unbiased rejection sampling so every value is equally likely.",
    icon: Dices,
    keywords: ["random number generator", "random number between", "pick a random number", "rng online"],
    local: true,
    status: "live",
    rank: 76,
    added: "2026-08-18",
    howTo: [
      "Set the minimum and maximum, and say whether those values may be picked.",
      "Choose how many numbers you need, and whether duplicates are allowed.",
      "Generate, then copy the results as a list or download them.",
    ],
    faqs: [
      {
        q: "Is this suitable for a lottery or a draw?",
        a: "For picking who goes first, yes. For anything with money or legal weight, use a draw process you can audit — no web page can prove to a third party that it was fair.",
      },
      {
        q: "How is the randomness produced?",
        a: "Values come from the browser's cryptographic random generator and are mapped into your range with rejection sampling, which avoids the subtle bias that a plain modulo operation introduces.",
      },
      {
        q: "Can I exclude numbers?",
        a: "You can turn duplicates off, which is what most draws need. For a specific exclusion list, generate a wider range and drop the values you do not want.",
      },
    ],
  },
  {
    slug: "tip-calculator",
    name: "Tip Calculator",
    category: "daily",
    tagline: "Tip, total and an even split between people",
    description:
      "Work out the tip on a bill at any percentage, add it to the total, and split the result evenly between any number of people.",
    icon: Receipt,
    keywords: ["tip calculator", "gratuity calculator", "split the bill", "how much to tip"],
    local: true,
    status: "live",
    rank: 74,
    added: "2026-08-20",
    howTo: [
      "Enter the bill amount before tip.",
      "Pick a tip percentage, or type your own if the local convention differs.",
      "Set how many people are splitting it.",
      "Read the per-person total, then use rounding-up to the nearest unit if you would rather pay in whole money.",
    ],
    faqs: [
      {
        q: "Should I tip on the pre-tax or the post-tax amount?",
        a: "On the pre-tax amount, which is what the traditional percentage refers to. Tipping on the tax-inclusive total works out slightly higher, so it is a safe choice if you are unsure.",
      },
      {
        q: "What if the service was poor?",
        a: "In most of the world, and in much of the United States, a tip is optional. If you are withholding it, saying so plainly is more useful to the staff than a silent smaller number.",
      },
      {
        q: "Does it handle unequal splits?",
        a: "No — it divides evenly. For an unequal split, work out each person's share separately and add their tip to it.",
      },
    ],
  },
  {
    slug: "stopwatch",
    name: "Stopwatch",
    category: "daily",
    tagline: "Elapsed time with laps and keyboard control",
    description:
      "A precise stopwatch with lap splits, a lap comparison column and keyboard shortcuts, which keeps accurate time even if the tab is backgrounded.",
    icon: Timer,
    keywords: ["stopwatch", "online stopwatch", "lap timer", "elapsed time"],
    local: true,
    status: "live",
    rank: 70,
    added: "2026-08-20",
    howTo: [
      "Start the timer with the button or the space bar.",
      "Record a lap with L, or reset with R.",
      "Read the split column to see how each lap compared with the fastest one so far.",
      "Leave the tab in the background if you need to — the timer measures real elapsed time rather than counting animation frames.",
    ],
    faqs: [
      {
        q: "Does it still keep time when I switch tabs?",
        a: "Yes. The elapsed value is derived from timestamps rather than from frame counting, so backgrounding the tab cannot make it drift.",
      },
      {
        q: "How accurate is it?",
        a: "Displayed to a hundredth of a second, though the true resolution is limited by the browser's timer precision, which most browsers coarsen to around a millisecond for security.",
      },
      {
        q: "How many laps can I record?",
        a: "There is no fixed cap, but the list keeps itself to the most recent 200 laps so a long session cannot lock up the page.",
      },
    ],
    limits: [
      "Browsers deliberately coarsen timer precision, so this is not a certified chronometer.",
      "Laps live in memory only — reloading or closing the tab discards them, and nothing is saved between visits.",
      "Only the 200 most recent laps are kept.",
    ],
  },
];
