/**
 * The three “Do it now” cards on the home page each hand a visitor off to the
 * full tool. Those hrefs are slugs written by hand, so they live here once and
 * are imported by both the client component that renders them and the
 * build-time guard (`lib/content-check.ts`) that asserts each is present and
 * live — the same treatment `GOAL_SLUGS` and `PASTE_DETECT_SLUGS` get, so a
 * rename fails the build instead of shipping a 404.
 *
 * The registry itself is deliberately not imported here: this module is pulled
 * into the client bundle, and only the strings are needed there.
 */
export const MINI_TASK_SLUGS = {
  countWords: "word-counter",
  collapseList: "remove-duplicate-lines",
  makeQr: "qr-code-generator",
} as const;
