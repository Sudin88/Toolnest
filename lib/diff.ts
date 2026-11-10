/**
 * Line and word diffing for the Text Compare tool.
 *
 * A classic LCS table is used. The table is bounded: past a certain size the
 * inputs are compared as whole blocks rather than cell by cell, so a pathological
 * paste cannot lock up the tab.
 */

export type DiffKind = "same" | "added" | "removed";

export interface DiffPart {
  kind: DiffKind;
  text: string;
}

const MAX_CELLS = 4_000_000;

function lcsTable(a: string[], b: string[]): Int32Array {
  const m = b.length;
  const dp = new Int32Array((a.length + 1) * (m + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * (m + 1) + j] =
        a[i] === b[j]
          ? dp[(i + 1) * (m + 1) + (j + 1)] + 1
          : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + (j + 1)]);
    }
  }
  return dp;
}

function diffTokens(a: string[], b: string[]): DiffPart[] {
  if (a.length === 0 && b.length === 0) return [];
  if (a.length === 0) return b.length ? [{ kind: "added", text: b.join("") }] : [];

  const tooBig = (a.length + 1) * (b.length + 1) > MAX_CELLS;
  if (tooBig) {
    const parts: DiffPart[] = [];
    if (a.length) parts.push({ kind: "removed", text: a.join("") });
    if (b.length) parts.push({ kind: "added", text: b.join("") });
    return parts;
  }

  const m = b.length;
  const dp = lcsTable(a, b);
  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;

  const push = (kind: DiffKind, text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };

  while (i < a.length && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i += 1;
      j += 1;
    } else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + (j + 1)]) {
      push("removed", a[i]);
      i += 1;
    } else {
      push("added", b[j]);
      j += 1;
    }
  }
  while (i < a.length) {
    push("removed", a[i]);
    i += 1;
  }
  while (j < m) {
    push("added", b[j]);
    j += 1;
  }

  return parts;
}

export interface LineDiff {
  kind: DiffKind;
  /** Text without the trailing newline. */
  text: string;
  /** 1-based line number in the original, or null for added lines. */
  leftNumber: number | null;
  /** 1-based line number in the revised text, or null for removed lines. */
  rightNumber: number | null;
  /** Word-level breakdown, only filled for changed lines. */
  words?: DiffPart[];
}

export interface DiffSummary {
  lines: LineDiff[];
  added: number;
  removed: number;
  unchanged: number;
}

function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.replace(/\n$/, "").split(/\r?\n/);
}

function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

export function diffText(
  original: string,
  revised: string,
  { ignoreCase = false, wordLevel = false } = {},
): DiffSummary {
  const left = splitLines(original);
  const right = splitLines(revised);

  const normalize = (value: string) => (ignoreCase ? value.toLowerCase() : value);
  const leftKeys = left.map(normalize);
  const rightKeys = right.map(normalize);

  const parts = diffTokens(leftKeys, rightKeys);

  // Walk the parts and reattach real text plus line numbers from each side.
  const lines: LineDiff[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of parts) {
    const lineCount = part.text.split("\n").length;

    if (part.kind === "same") {
      for (let k = 0; k < lineCount; k += 1) {
        lines.push({
          kind: "same",
          text: left[leftIndex] ?? "",
          leftNumber: leftIndex + 1,
          rightNumber: rightIndex + 1,
        });
        leftIndex += 1;
        rightIndex += 1;
        unchanged += 1;
      }
      continue;
    }

    if (part.kind === "removed") {
      for (let k = 0; k < lineCount; k += 1) {
        lines.push({
          kind: "removed",
          text: left[leftIndex] ?? "",
          leftNumber: leftIndex + 1,
          rightNumber: null,
        });
        leftIndex += 1;
        removed += 1;
      }
      continue;
    }

    for (let k = 0; k < lineCount; k += 1) {
      lines.push({
        kind: "added",
        text: right[rightIndex] ?? "",
        leftNumber: null,
        rightNumber: rightIndex + 1,
      });
      rightIndex += 1;
      added += 1;
    }
  }

  // Word-level breakdown: pair each removed line with the added line that
  // replaces it, in order, and diff the two lines word by word.
  if (wordLevel) {
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].kind !== "removed") continue;
      // Find the mirroring added run.
      let end = index;
      while (end + 1 < lines.length && lines[end + 1].kind === "removed") end += 1;
      let addEnd = end;
      while (addEnd + 1 < lines.length && lines[addEnd + 1].kind === "added") addEnd += 1;

      const removedRun = lines.slice(index, end + 1);
      const addedRun = lines.slice(end + 1, addEnd + 1);

      const pairs = Math.min(removedRun.length, addedRun.length);
      for (let p = 0; p < pairs; p += 1) {
        const removedLine = removedRun[p];
        const addedLine = addedRun[p];
        const words = diffTokens(
          tokenize(normalize(removedLine.text)),
          tokenize(normalize(addedLine.text)),
        );
        // Both rows share the breakdown; the renderer drops the parts that do not
        // belong to each side.
        removedLine.words = words;
        addedLine.words = words;
      }
      index = addEnd;
    }
  }

  return { lines, added, removed, unchanged };
}
