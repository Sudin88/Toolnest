import { GOAL_SLUGS } from "@/lib/goals";
import { MINI_TASK_SLUGS } from "@/lib/mini-tasks";
import { PASTE_DETECT_SLUGS } from "@/lib/paste-detect";
import { isLive } from "@/lib/tools/registry";

/**
 * Server-only guard for hand-authored content that names tools.
 *
 * The home page's goal block, the paste box and the three “Do it now” cards all
 * point at specific slugs. Those lists are written by hand, so the one failure
 * mode worth engineering away is a rename: a tool slug changes, the registry
 * moves on, and the copy keeps pointing at a route that no longer exists. This
 * asserts every slug those modules reference is present *and* live, at build
 * time, so the build fails loudly instead of shipping a dead link or a planned
 * tool.
 *
 * It is cheap (three array scans) and only ever runs on the server, where the
 * full registry is available.
 */
export function assertContent(): void {
  const referenced = [...GOAL_SLUGS, ...PASTE_DETECT_SLUGS, ...Object.values(MINI_TASK_SLUGS)];
  const missing = [...new Set(referenced.filter((slug) => !isLive(slug)))];

  if (missing.length > 0) {
    throw new Error(
      `Home content references tools that are missing or not live: ${missing.join(", ")}. ` +
        `Fix the slug in lib/goals.ts, lib/paste-detect.ts or lib/mini-tasks.ts, or flip the tool to "live".`,
    );
  }
}
