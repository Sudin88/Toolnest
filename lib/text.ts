/**
 * Pure text utilities used by the text tools. No DOM, no randomness — these are
 * deterministic so they are safe to call during render.
 */

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text: string, includeSpaces: boolean): number {
  if (includeSpaces) return [...text].length;
  return [...text.replace(/\s/g, "")].length;
}

/** UTF-16 length, which is what most form fields actually enforce. */
export function utf16Length(text: string): number {
  return text.length;
}

/** One encoder for the module: constructing one per call is pure overhead. */
const UTF8_ENCODER = new TextEncoder();

export function utf8ByteLength(text: string): number {
  return UTF8_ENCODER.encode(text).length;
}

/**
 * Above this many characters the text tools ask for a smaller paste rather than
 * running a whole-document pass. It is generous — a million characters is a long
 * report — while keeping the tab responsive on the machine this runs on.
 */
export const MAX_TEXT_LENGTH = 1_000_000;

/**
 * Above this many characters the live-metric tools run their counts on a value
 * that lags by a render, so a paste big enough that a whole-document pass is
 * noticeable cannot hold up typing. Below it the counts stay perfectly live,
 * because they are cheap enough that deferring them would only add lag.
 */
export const DEFER_TEXT_LENGTH = 100_000;

export function countSentences(text: string): number {
  // A single forward scan. The previous version matched with a regex that had to
  // restart at each run of sentence-ending punctuation, which was quadratic on a
  // document made mostly of them.
  let sentences = 0;
  let inSentence = false;
  for (const char of text) {
    if (char === "." || char === "!" || char === "?" || char === "…") {
      if (inSentence) {
        sentences += 1;
        inSentence = false;
      }
    } else if (/\S/.test(char)) {
      inSentence = true;
    }
  }
  return inSentence ? sentences + 1 : sentences;
}

export function countParagraphs(text: string): number {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean).length;
}

export interface ReadingTime {
  /** Whole minutes at the prose rate. */
  minutes: number;
  /** Seconds remainder, for short passages. */
  seconds: number;
}

export function readingTime(words: number, wordsPerMinute = 200): ReadingTime {
  if (words === 0) return { minutes: 0, seconds: 0 };
  const totalSeconds = Math.round((words / wordsPerMinute) * 60);
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

export interface KeywordCount {
  word: string;
  count: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these",
  "those", "as", "by", "from", "i", "you", "he", "she", "they", "we", "not", "no",
  "so", "if", "then", "than", "too", "very", "can", "will", "just", "do", "does",
]);

export function keywordFrequency(text: string, limit = 8, includeStopWords = false): KeywordCount[] {
  // Unicode-aware so non-Latin scripts get a keyword list instead of an empty one.
  const words = text.toLowerCase().match(/[\p{L}\p{N}'’-]{2,}/gu);
  if (!words) return [];

  const counts = new Map<string, number>();
  for (const word of words) {
    if (!includeStopWords && STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/* ------------------------------------------------------------------- case */

/**
 * Split identifiers on separators *and* camel-case boundaries.
 *
 * Unicode-aware: accented Latin, Cyrillic, Greek and other alphabets survive
 * instead of being stripped, so the identifier cases never return empty output
 * for a non-English input.
 */
function splitWords(text: string): string[] {
  return text
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toSentenceCase(text: string): string {
  const lowered = text.toLowerCase();
  return lowered.replace(
    /(^\s*|[.!?…]\s+|\n\s*)(\p{Ll})/gu,
    (_match, prefix: string, letter: string) => prefix + letter.toUpperCase(),
  );
}

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on",
  "or", "per", "the", "to", "up", "via", "vs",
]);

function toTitleCase(text: string): string {
  // A single pass that remembers whether the previous word ended a sentence.
  // The earlier version re-sliced the whole prefix for every word, which was
  // quadratic on a long document. Unicode letters are matched whole, so accented
  // words are never split mid-word (which used to produce "RéSumé").
  const wordPattern = /[\p{L}][\p{L}'’-]*/gu;
  let result = "";
  let cursor = 0;
  let startsSentence = true;
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(text)) !== null) {
    const between = text.slice(cursor, match.index);
    if (cursor === 0 || /[.!?:]\s*$/.test(between) || /\n\s*$/.test(between)) startsSentence = true;
    const word = match[0];
    const lower = word.toLowerCase();
    const title =
      !startsSentence && SMALL_WORDS.has(lower)
        ? lower
        : lower.charAt(0).toUpperCase() + lower.slice(1);
    result += between + title;
    cursor = match.index + word.length;
    startsSentence = false;
  }

  return result + text.slice(cursor);
}

function toCamelCase(text: string): string {
  const words = splitWords(text).map((word) => word.toLowerCase());
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

function toPascalCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function toSnakeCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .join("_");
}

function toKebabCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .join("-");
}

function toConstantCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toUpperCase())
    .join("_");
}

export const CASE_IDS = [
  "upper",
  "lower",
  "sentence",
  "title",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
] as const;

export type CaseId = (typeof CASE_IDS)[number];

export const CASE_LABELS: Record<CaseId, string> = {
  upper: "UPPER CASE",
  lower: "lower case",
  sentence: "Sentence case",
  title: "Title Case",
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  kebab: "kebab-case",
  constant: "CONSTANT_CASE",
};

export function applyCase(text: string, id: CaseId): string {
  switch (id) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "sentence":
      return toSentenceCase(text);
    case "title":
      return toTitleCase(text);
    case "camel":
      return toCamelCase(text);
    case "pascal":
      return toPascalCase(text);
    case "snake":
      return toSnakeCase(text);
    case "kebab":
      return toKebabCase(text);
    case "constant":
      return toConstantCase(text);
    default:
      return text;
  }
}

/* ---------------------------------------------------------------- dedupe */

export interface DedupeOptions {
  ignoreCase: boolean;
  trim: boolean;
  removeEmpty: boolean;
  sort: boolean;
}

export interface DedupeResult {
  output: string;
  /** Lines kept, after trimming, blank removal and de-duplication. */
  kept: number;
  /** Lines dropped because an identical line was already kept. */
  duplicates: number;
  /** Blank lines dropped because `removeEmpty` was on. */
  blanks: number;
  total: number;
}

export function dedupeLines(input: string, options: DedupeOptions): DedupeResult {
  const rawLines = input.split(/\r?\n/);
  const total = rawLines.length;
  const seen = new Set<string>();
  const kept: string[] = [];
  let blanks = 0;

  for (const rawLine of rawLines) {
    const line = options.trim ? rawLine.trim() : rawLine;
    if (line === "" && options.removeEmpty) {
      blanks += 1;
      continue;
    }
    const key = options.ignoreCase ? line.toLowerCase() : line;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(line);
  }

  const output = options.sort
    ? [...kept].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: options.ignoreCase ? "base" : "variant" }))
    : kept;

  return {
    output: output.join("\n"),
    kept: kept.length,
    // Every dropped line is either a blank or an exact duplicate of one already
    // kept, so this split is the single definition of what was removed.
    duplicates: total - kept.length - blanks,
    blanks,
    total,
  };
}

/* ---------------------------------------------------------------- lorem */
