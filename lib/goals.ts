/**
 * “Which tool do I need?” — goal-based entry points.
 *
 * A visitor rarely arrives knowing a tool name; they arrive with a job. These
 * six entries map a plain description of the job to the tools that do it. The
 * list is typed, references registry slugs only, and every slug is asserted live
 * at build time (`lib/content-check.ts`), so a renamed tool fails the build
 * rather than leaving a dead link.
 *
 * The first slug in each entry is the primary destination; the rest are offered
 * as secondary links. Nothing here hardcodes a tool name — names are resolved
 * from the registry when the page is built.
 */

export interface Goal {
  id: string;
  /** The job, in the visitor's words. */
  title: string;
  /** A half-sentence of concrete detail. */
  blurb: string;
  /** Registry slugs that serve this goal, primary first. */
  slugs: readonly string[];
}

export const goals: readonly Goal[] = [
  {
    id: "smaller",
    title: "Make a file smaller",
    blurb: "Compress a photo before you email it, or shrink it to an exact size.",
    slugs: ["compress-image", "resize-image"],
  },
  {
    id: "tidy-text",
    title: "Clean up messy text",
    blurb: "Strip duplicate lines, fix the letter case, compare two drafts.",
    slugs: ["remove-duplicate-lines", "case-converter", "text-compare"],
  },
  {
    id: "money",
    title: "Work out a loan or a tip",
    blurb: "Repayments with interest, or an awkward bill split.",
    slugs: ["loan-calculator", "tip-calculator", "percentage-calculator"],
  },
  {
    id: "link",
    title: "Check what a link contains",
    blurb: "Break a URL into its parts, or encode and decode one safely.",
    slugs: ["url-parser", "url-encoder-decoder"],
  },
  {
    id: "payload",
    title: "Tidy up a payload",
    blurb: "Format or validate JSON, and read base64 back into text.",
    slugs: ["json-formatter", "base64-encoder-decoder"],
  },
  {
    id: "count",
    title: "Count words or characters",
    blurb: "Hit a word limit, or measure a piece of copy as you write it.",
    slugs: ["word-counter", "character-counter"],
  },
];

/** Every slug any goal points at. Asserted live at build time. */
export const GOAL_SLUGS: readonly string[] = goals.flatMap((goal) => goal.slugs);
