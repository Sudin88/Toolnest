/**
 * Paste detection for the home box.
 *
 * The box accepts a search query, pasted text or a dropped file. This module
 * answers one question: given some text, which tools obviously accept it? It is
 * a pure function — no registry import, no browser global except a guarded
 * `atob` — so it can be reasoned about in isolation and cheaply shipped to the
 * client.
 *
 * It returns *slugs*, never tool objects. The caller resolves them against the
 * search index, which contains live tools only, so a planned or unknown slug is
 * silently dropped rather than advertised. `lib/content-check.ts` asserts at
 * build time that every slug named below is live, so a typo fails the build
 * instead of disappearing.
 *
 * Case table (the source of truth for the behaviour, kept next to the code):
 *
 * | Input                                  | Kind   | Suggestions                                   |
 * | -------------------------------------- | ------ | --------------------------------------------- |
 * | "" or only whitespace                  | empty  | —                                             |
 * | `{"a":1}` / `[1,2,3]` that parses      | json   | json-formatter                                |
 * | `https://example.com/a?b=c`            | url    | url-parser, url-encoder-decoder               |
 * | `aGVsbG8gd29ybGQ=` (decodes to text)   | base64 | base64-encoder-decoder                        |
 * | `#d93a0f` / `rgb(217, 58, 15)`         | colour | — (no live tool accepts a bare colour)        |
 * | a sentence or two, or any multiline    | prose  | word-counter, case-converter, remove-duplicate-lines |
 * | `merge pdf`, `work out a loan`         | query  | — (the fuzzy ranker handles these)            |
 *
 * A colour is detected on purpose and then suggested nothing: the Image Colour
 * Picker reads an *image*, not a colour code, so pointing at it would be a lie.
 */

export type PasteKind = "empty" | "json" | "url" | "base64" | "colour" | "prose" | "query";

export interface PasteSuggestion {
  slug: string;
  /** Why the tool was suggested — shown beside it so the guess is not a black box. */
  reason: string;
}

export interface PasteDetection {
  kind: PasteKind;
  /** A short human label for the detected kind, or "" when there is nothing to say. */
  label: string;
  suggestions: PasteSuggestion[];
}

const JSON_START = /^[[{]/;
const URL_SHAPE = /^https?:\/\/\S+$/i;
const COLOUR_SHAPE =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$|^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/i;
const BASE64_SHAPE = /^[A-Za-z0-9+/]+={0,2}$/;

function looksLikeJson(text: string): boolean {
  if (!JSON_START.test(text)) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Base64 is the only guess worth being conservative about: it shares an alphabet
 * with ordinary words. Require a plausible length, correct padding, and — when
 * `atob` exists — that the decoded bytes are mostly printable text.
 */
function looksLikeBase64(text: string): boolean {
  if (text.length < 16 || text.length % 4 !== 0) return false;
  if (!BASE64_SHAPE.test(text)) return false;
  if (typeof atob !== "function") return true;
  try {
    const decoded = atob(text);
    if (decoded.length === 0) return false;
    let printable = 0;
    for (let index = 0; index < decoded.length; index += 1) {
      const code = decoded.charCodeAt(index);
      if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) printable += 1;
    }
    return printable / decoded.length > 0.9;
  } catch {
    return false;
  }
}

function looksLikeProse(text: string): boolean {
  if (text.includes("\n")) return true;
  if (text.length > 80) return true;
  // Two or more words ending a sentence reads as copy, not as a search.
  return text.split(/\s+/).filter(Boolean).length >= 4 && /[.!?](\s|$)/.test(text);
}

export function detectInput(raw: string): PasteDetection {
  const text = raw.trim();

  if (text.length === 0) {
    return { kind: "empty", label: "", suggestions: [] };
  }

  if (looksLikeJson(text)) {
    return {
      kind: "json",
      label: "Looks like JSON",
      suggestions: [{ slug: "json-formatter", reason: "Validate, format or minify it" }],
    };
  }

  if (URL_SHAPE.test(text)) {
    return {
      kind: "url",
      label: "Looks like a link",
      suggestions: [
        { slug: "url-parser", reason: "See what the link is made of" },
        { slug: "url-encoder-decoder", reason: "Encode or decode it" },
      ],
    };
  }

  if (looksLikeBase64(text)) {
    return {
      kind: "base64",
      label: "Looks like base64",
      suggestions: [{ slug: "base64-encoder-decoder", reason: "Decode it back to text" }],
    };
  }

  if (COLOUR_SHAPE.test(text)) {
    return {
      kind: "colour",
      label: "Looks like a colour value",
      // Deliberately empty: nothing here turns a colour code into anything.
      suggestions: [],
    };
  }

  if (looksLikeProse(text)) {
    return {
      kind: "prose",
      label: "Looks like text",
      suggestions: [
        { slug: "word-counter", reason: "Count words and reading time" },
        { slug: "case-converter", reason: "Change the letter case" },
        { slug: "remove-duplicate-lines", reason: "Collapse repeated lines" },
      ],
    };
  }

  return { kind: "query", label: "", suggestions: [] };
}

/** Every slug `detectInput` can name. Asserted live at build time. */
export const PASTE_DETECT_SLUGS: readonly string[] = [
  "json-formatter",
  "url-parser",
  "url-encoder-decoder",
  "base64-encoder-decoder",
  "word-counter",
  "case-converter",
  "remove-duplicate-lines",
];
