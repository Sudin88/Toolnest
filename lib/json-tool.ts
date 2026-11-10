/**
 * JSON parsing and formatting for the JSON Formatter tool. Parsing uses the
 * browser's own parser; error positions are extracted from the parser message
 * rather than guessed.
 */

export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string; line: number; column: number };

export function parseJson(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Invalid JSON";
    return { ok: false, message: humanize(raw), ...locate(raw, text) };
  }
}

/** V8 puts "(line 2 column 3)" in newer messages and "at position 12" in older ones. */
function locate(message: string, text: string): { line: number; column: number } {
  const lineColumn = /line (\d+) column (\d+)/.exec(message);
  if (lineColumn) return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) };

  const position = /position (\d+)/.exec(message);
  if (position) {
    const index = Number(position[1]);
    const before = text.slice(0, index);
    const line = before.split("\n").length;
    const column = index - before.lastIndexOf("\n");
    return { line, column };
  }

  return { line: 1, column: 1 };
}

/** Drop the embedded input snippet so the message stays about the mistake. */
function humanize(message: string): string {
  let text = message;
  const snippet = text.indexOf(', "');
  if (snippet > 0) text = text.slice(0, snippet);
  text = text.replace(/\s+in JSON at position.*$/, "");
  text = text.replace(/\s+at line.*$/, "");
  text = text.trim();
  if (text.endsWith(",")) text = text.slice(0, -1);
  return text.length > 0 ? `${text}.` : "That is not valid JSON.";
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort((a, b) => a.localeCompare(b))) {
      out[key] = sortJsonKeys(source[key]);
    }
    return out;
  }
  return value;
}

export function stringifyJson(value: unknown, indent: number, sortKeys: boolean): string {
  return JSON.stringify(sortKeys ? sortJsonKeys(value) : value, null, indent);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

export function countKeys(value: unknown): { objects: number; arrays: number; leaves: number } {
  let objects = 0;
  let arrays = 0;
  let leaves = 0;

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      arrays += 1;
      node.forEach(walk);
    } else if (node !== null && typeof node === "object") {
      objects += 1;
      Object.values(node as Record<string, unknown>).forEach(walk);
    } else {
      leaves += 1;
    }
  };

  walk(value);
  return { objects, arrays, leaves };
}
