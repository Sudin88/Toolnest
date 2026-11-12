"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadImageFile, type LoadedImage } from "@/lib/image";
import { MAX_BATCH_BYTES, MAX_IMAGES_TO_PDF } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

/** One image in a batch, kept together with the object URL that previews it. */
export interface ImageEntry {
  id: string;
  file: File;
  image: LoadedImage;
  url: string;
}

/**
 * An ordered, capped list of decoded images — the state half of Images to PDF.
 *
 * The count and combined-size caps are applied *before* anything is decoded, so
 * a large drop never spends time decoding bitmaps that would only be discarded.
 * Every object URL created here is revoked here: on removal, on clear, and on
 * unmount, so navigating away does not leak a blob per image.
 *
 * `onChange` fires whenever the batch is mutated, so the tool can drop a result
 * built from the previous list. It must be stable (wrap it in `useCallback`).
 */
export function useImageBatch(onChange: () => void) {
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);
  const entriesRef = useRef(entries);
  const bytesRef = useRef(0);

  useEffect(() => {
    entriesRef.current = entries;
    bytesRef.current = entries.reduce((sum, entry) => sum + entry.file.size, 0);
  }, [entries]);

  useEffect(
    () => () => {
      for (const entry of entriesRef.current) URL.revokeObjectURL(entry.url);
    },
    [],
  );

  const add = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setBusy(true);
      setError(null);

      // Apply the count and combined-size caps *before* decoding anything, so a
      // big drop never decodes sixty large bitmaps only to discard most of them.
      const room = Math.max(0, MAX_IMAGES_TO_PDF - entriesRef.current.length);
      if (room === 0) {
        setError(`Only ${MAX_IMAGES_TO_PDF} images are handled at once. Remove one before adding more.`);
        setBusy(false);
        return;
      }

      let running = bytesRef.current;
      const batch: File[] = [];
      let overCount = 0;
      let overSize = 0;
      for (const file of files) {
        if (batch.length >= room) {
          overCount += 1;
          continue;
        }
        if (running + file.size > MAX_BATCH_BYTES) {
          overSize += 1;
          continue;
        }
        batch.push(file);
        running += file.size;
      }

      const added: ImageEntry[] = [];
      const problems: string[] = [];
      for (const file of batch) {
        try {
          const image = await loadImageFile(file);
          counter.current += 1;
          added.push({ id: `img-${counter.current}`, file, image, url: URL.createObjectURL(file) });
        } catch (cause) {
          problems.push(cause instanceof Error ? cause.message : `“${file.name}” could not be opened.`);
        }
      }

      if (overCount > 0) {
        problems.push(
          `Only ${MAX_IMAGES_TO_PDF} images are handled at once, so ${overCount} were not added.`,
        );
      }
      if (overSize > 0) {
        problems.push(
          `The combined size is limited to ${formatBytes(MAX_BATCH_BYTES)}, so ${overSize} ${overSize === 1 ? "image was" : "images were"} not added.`,
        );
      }

      if (added.length > 0) {
        bytesRef.current += added.reduce((sum, entry) => sum + entry.file.size, 0);
        setEntries((prev) => prev.concat(added));
      }
      if (problems.length > 0) setError(problems.join(" "));
      setBusy(false);
      onChange();
    },
    [onChange],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      setEntries((prev) => {
        const index = prev.findIndex((entry) => entry.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= prev.length) return prev;
        const next = prev.slice();
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
      onChange();
    },
    [onChange],
  );

  const remove = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const entry = prev.find((item) => item.id === id);
        if (entry) URL.revokeObjectURL(entry.url);
        return prev.filter((item) => item.id !== id);
      });
      onChange();
    },
    [onChange],
  );

  const clear = useCallback(() => {
    for (const entry of entriesRef.current) URL.revokeObjectURL(entry.url);
    setEntries([]);
    setError(null);
    onChange();
  }, [onChange]);

  return { entries, error, busy, add, move, remove, clear };
}
