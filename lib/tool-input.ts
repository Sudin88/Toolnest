"use client";

import { useCallback } from "react";

import { useHandoverText } from "@/lib/handover";
import { useToolDraft } from "@/lib/tool-draft";

/**
 * The main input of a tool, wired to the two persistence rules in one place.
 *
 * - **Draft.** The value survives a reload within the tab, via `useToolDraft`
 *   (sessionStorage, capped and wrapped). This is for small text and number
 *   input only; a tool that handles files, generated passwords, keys or UUIDs
 *   keeps plain `useState` instead.
 * - **Hand-over.** When the home box recognises pasted text and sends the
 *   visitor straight to a tool, the text waits under the tool's slug for exactly
 *   one read. `useHandoverText` applies it once, after mount, then clears it —
 *   so the server HTML and the first client render still agree, and a later
 *   visit starts empty.
 *
 * Only tools that accept text pass `handover: true`. Everything else uses the
 * draft half by itself, so a file never travels through either mechanism.
 */
export function useToolInput<T>(
  slug: string,
  field: string,
  initial: T,
  options?: { handover?: boolean },
): [T, (value: T) => void] {
  const [value, setValue] = useToolDraft<T>(slug, field, initial);

  const apply = useCallback(
    (text: string) => {
      // The hand-over is only ever staged for text-like tools, whose main input
      // is a string, so the cast is safe by construction.
      setValue(text as unknown as T);
    },
    [setValue],
  );

  // An empty slug means "no hand-over for this tool"; `takeHandover` then finds
  // nothing and does nothing.
  useHandoverText(options?.handover ? slug : "", apply);

  return [value, setValue];
}
