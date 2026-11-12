"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  emitKey,
  parseJson,
  readRaw,
  subscribeToKey,
  writeJson,
} from "@/lib/browser-store";

/**
 * A session-scoped draft of the small inputs a tool remembers while the visitor
 * stays in the tab — a loan amount, a unit, a paragraph of text. It is kept in
 * `sessionStorage`, so it disappears when the tab closes and is never shared
 * across tabs or devices.
 *
 * What may be drafted: short settings and small typed input.
 * What must never be drafted: files, passwords, secrets, tokens, or a payload
 * the tool itself warns may contain credentials. Those tools keep plain state.
 *
 * Two properties make this cheap enough to run on every keystroke: the value in
 * memory is authoritative (storage is only re-read when another tab changes it),
 * and the write to storage is deferred, so typing never does a synchronous
 * stringify-and-store of the whole record.
 */
const KEY = "toolnest-draft";
const EVENT = "toolnest:draft";
const VERSION = 1;

/** The store is trimmed to fit this when it is written: an oversized field or a
 * tool that would push it past the ceiling is dropped rather than the whole
 * write being abandoned. */
const MAX_STORE_CHARS = 64 * 1024;
/** A single drafted string longer than this is tool input, not a small draft, so
 * it is not persisted. This bounds the payload before it is ever serialised. */
const MAX_FIELD_CHARS = 8 * 1024;
/** Keep the record from growing to one entry per tool ever opened. */
const MAX_TOOLS = 40;
/** Trailing delay for the storage write, in the house 150–200 ms band. */
const WRITE_DELAY_MS = 200;

type ToolDraft = Record<string, unknown>;
type Store = Record<string, ToolDraft>;

const EMPTY: Store = {};

/** The last value written is authoritative; storage is only a backup. */
let cache: Store = EMPTY;
let loaded = false;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * A payload from an older build, a hand-edited value, or a future schema is read
 * defensively and never trusted: anything that is not a record of tool records
 * collapses to empty rather than reaching a component.
 */
function normalise(parsed: unknown): Store {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY;
  const record = parsed as Record<string, unknown>;
  const tools =
    typeof record.version === "number" && record.tools && typeof record.tools === "object"
      ? record.tools
      : record;
  if (!tools || typeof tools !== "object" || Array.isArray(tools)) return EMPTY;

  const next: Store = {};
  for (const [tool, fields] of Object.entries(tools)) {
    if (fields && typeof fields === "object" && !Array.isArray(fields)) {
      next[tool] = { ...(fields as ToolDraft) };
    }
  }
  return next;
}

function ensureLoaded(): Store {
  if (loaded) return cache;
  loaded = true;
  cache = normalise(parseJson(readRaw(window.sessionStorage, KEY)));
  return cache;
}

/**
 * Reduce the store to what can actually be persisted: drop any string field
 * larger than `MAX_FIELD_CHARS`, then evict the oldest tools until the
 * serialised record fits `MAX_STORE_CHARS`.
 *
 * Eviction rather than abort, because one oversized draft must not silently stop
 * every other tool from persisting — the previous behaviour did exactly that.
 * The per-field cap comes first so a multi-megabyte paste is never stringified
 * just to be measured.
 */
function persistable(store: Store): Store {
  const trimmed: Store = {};
  for (const [tool, draft] of Object.entries(store)) {
    const fields: ToolDraft = {};
    for (const [field, value] of Object.entries(draft)) {
      if (typeof value === "string" && value.length > MAX_FIELD_CHARS) continue;
      fields[field] = value;
    }
    trimmed[tool] = fields;
  }

  // `write` re-inserts the touched tool last, so the entries are oldest-first:
  // dropping from the front evicts the least recently used tools.
  const entries = Object.entries(trimmed);
  for (let start = 0; start < entries.length; start += 1) {
    const candidate = Object.fromEntries(entries.slice(start));
    if (JSON.stringify({ version: VERSION, tools: candidate }).length <= MAX_STORE_CHARS) {
      return candidate;
    }
  }
  return EMPTY;
}

function scheduleWrite(): void {
  if (writeTimer !== null) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    writeJson(window.sessionStorage, KEY, { version: VERSION, tools: persistable(cache) });
  }, WRITE_DELAY_MS);
}

function subscribe(onChange: () => void) {
  return subscribeToKey(KEY, EVENT, onChange, () => {
    loaded = false; // another tab changed it; re-read on the next snapshot
    onChange();
  });
}

function write(tool: string, field: string, value: unknown): void {
  const current = ensureLoaded();
  const toolDraft: ToolDraft = { ...(current[tool] ?? {}) };
  if (value === undefined) delete toolDraft[field];
  else toolDraft[field] = value;

  const next: Store = { ...current };
  // Delete then re-add so the tool moves to the end of the insertion order and
  // is the last one evicted once the record exceeds `MAX_TOOLS`.
  delete next[tool];
  next[tool] = toolDraft;

  const entries = Object.entries(next);
  cache = entries.length > MAX_TOOLS ? Object.fromEntries(entries.slice(-MAX_TOOLS)) : next;

  emitKey(EVENT);
  scheduleWrite();
}

/** Reject a stored value that no longer matches the field's type. */
export type DraftDecoder<T> = (value: unknown) => T | undefined;

export interface DraftOptions<T> {
  /**
   * Turns a stored value back into the field's type, returning `undefined` for
   * anything that does not fit. A stale or hand-edited payload then falls back
   * to `initial` instead of reaching the tool as the wrong shape.
   */
  decode?: DraftDecoder<T>;
}

/** The `number | ""` shape most numeric inputs use. */
export const draftNumber: DraftDecoder<number | ""> = (value) =>
  typeof value === "number" || value === "" ? value : undefined;

/** A plain string, rejecting anything a hand-edited payload might have put there. */
export const draftString: DraftDecoder<string> = (value) =>
  typeof value === "string" ? value : undefined;

/** A decoder for a string restricted to the given set of allowed values. */
export function draftOneOf<T extends string>(allowed: readonly T[]): DraftDecoder<T> {
  return (value) => (typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined);
}

/**
 * State that behaves like `useState` but survives a reload within the session.
 * Before hydration it renders `initial`, so the server and the first client
 * render agree.
 *
 * `initial` and `decode` are both compared by identity inside the snapshot, so
 * both must be stable. Pass a primitive or a module-level constant for
 * `initial` — a fresh object or array built during render makes `getSnapshot`
 * return a new value on every call, which React reports as an uncached
 * snapshot — and build `decode` once rather than inside the component. Every
 * caller passes a primitive today; a non-primitive would need a hoisted
 * constant or a `useRef`.
 */
export function useToolDraft<T>(
  tool: string,
  field: string,
  initial: T,
  options?: DraftOptions<T>,
): [T, (value: T) => void] {
  const decode = options?.decode;

  const getSnapshot = useCallback((): T => {
    const stored = ensureLoaded()[tool]?.[field];
    if (stored === undefined) return initial;
    if (!decode) return stored as T;
    const decoded = decode(stored);
    return decoded === undefined ? initial : decoded;
  }, [tool, field, initial, decode]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initial);
  const set = useCallback((next: T) => write(tool, field, next), [tool, field]);
  return [value, set];
}
