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

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function countSentences(text: string): number {
  const matches = text.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…\s][^.!?…]*$/g);
  return matches ? matches.filter((s) => s.trim().length > 0).length : 0;
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

export function toSentenceCase(text: string): string {
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

export function toTitleCase(text: string): string {
  // Unicode letters, so accented words are matched whole and never split
  // mid-word (which used to produce results like "RéSumé").
  return text.replace(/[\p{L}][\p{L}'’-]*/gu, (word, offset: number, full: string) => {
    const isFirst = offset === 0 || /[.!?:]\s*$/.test(full.slice(0, offset)) || /\n\s*$/.test(full.slice(0, offset));
    const lower = word.toLowerCase();
    if (!isFirst && SMALL_WORDS.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

export function toCamelCase(text: string): string {
  const words = splitWords(text).map((word) => word.toLowerCase());
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

export function toPascalCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export function toSnakeCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .join("_");
}

export function toKebabCase(text: string): string {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .join("-");
}

export function toConstantCase(text: string): string {
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
  kept: number;
  removed: number;
  total: number;
}

export function dedupeLines(input: string, options: DedupeOptions): DedupeResult {
  const rawLines = input.split(/\r?\n/);
  const total = rawLines.length;
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const rawLine of rawLines) {
    const line = options.trim ? rawLine.trim() : rawLine;
    if (options.removeEmpty && line === "") continue;
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
    removed: total - kept.length - (options.removeEmpty ? rawLines.filter((l) => l.trim() === "").length : 0),
    total,
  };
}

/* ---------------------------------------------------------------- lorem */
