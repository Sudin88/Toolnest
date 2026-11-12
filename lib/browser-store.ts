"use client";

/**
 * One guarded wrapper around browser storage.
 *
 * Every store in this app faces the same two facts: a storage call can throw
 * (private mode, disabled storage, a full quota), and a stored payload can be
 * anything at all (an older build, a hand-edited value, another tab mid-write).
 * Keeping the `try/catch` and the `JSON.parse` here means no module has to
 * re-derive that defensive scaffolding, and each store can then be read for what
 * it actually holds rather than for how it survives.
 *
 * Nothing here touches `window` until a function is called, so importing a
 * module that builds a store at its top level is safe on the server.
 */

/** The raw string at `key`, or `null` when it is absent or unreadable. */
export function readRaw(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Parses stored text defensively: a malformed payload reads as `null`. */
export function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** The parsed value at `key`, or `null` when it is absent or unreadable. */
export function readJson(storage: Storage, key: string): unknown {
  return parseJson(readRaw(storage, key));
}

/** Writes a value as JSON; a refusal from storage is silently ignored. */
export function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is a convenience everywhere it is used here.
  }
}

/** Deletes a key; a refusal from storage is silently ignored. */
export function removeKey(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // As above.
  }
}

/** Tells this tab that `event`'s key changed. */
export function emitKey(event: string): void {
  try {
    window.dispatchEvent(new Event(event));
  } catch {
    // A dispatch that fails must not break the caller.
  }
}

/**
 * Subscribes to one key changing — from another tab through `storage`, and from
 * this tab through the caller's own custom `event`. Returns the unsubscribe.
 *
 * `onExternal` fires only for the cross-tab `storage` event, which is where a
 * store that keeps an in-memory copy needs to invalidate it; it defaults to
 * `onChange`. A `storage` event with a `null` key means the whole store was
 * cleared, which counts as a change the subscriber must see.
 */
export function subscribeToKey(
  key: string,
  event: string,
  onChange: () => void,
  onExternal: () => void = onChange,
): () => void {
  const onStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key === null || storageEvent.key === key) onExternal();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(event, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(event, onChange);
  };
}

/**
 * A reader for one JSON key that returns a **stable reference** while the stored
 * text is unchanged — which is exactly what `useSyncExternalStore` demands, and
 * the reason the text is compared rather than the decoded value.
 *
 * `getStorage` is called on each read rather than captured, so a store can be
 * built at module scope without touching `window` on the server.
 */
export function createJsonReader<T>(
  getStorage: () => Storage,
  key: string,
  decode: (parsed: unknown) => T,
): () => T {
  let cacheRaw: string | null = null;
  let cache: T | undefined;
  let primed = false;
  return () => {
    const raw = readRaw(getStorage(), key);
    if (primed && raw === cacheRaw) return cache as T;
    cacheRaw = raw;
    cache = decode(parseJson(raw));
    primed = true;
    return cache;
  };
}
