"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_PDF_FILES,
  loadPdfDocument,
  looksLikePdf,
  validatePdfFile,
} from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

/**
 * Every PDF tool opens a file the same way: check the name and size, read the
 * bytes, confirm the `%PDF-` header is really there, then count the pages. One
 * implementation means seven tools cannot disagree about what a rejected file
 * says or when a page count is trustworthy.
 */

export interface LoadedPdf {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
  /** Each page's own rotation as stored in the file, for an honest preview. */
  rotations: number[];
  /** Each page's box in points, for page-shaped previews. */
  sizes: { width: number; height: number }[];
}

export interface PdfFileEntry {
  id: string;
  name: string;
  size: number;
  bytes: Uint8Array;
  pageCount: number;
  rotations: number[];
}

async function readPdfFile(file: File): Promise<{
  bytes: Uint8Array;
  pageCount: number;
  rotations: number[];
  sizes: { width: number; height: number }[];
}> {
  const problem = validatePdfFile(file);
  if (problem) throw new Error(problem);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(bytes)) {
    throw new Error(`“${file.name}” is not a PDF — the %PDF- header is missing, whatever the name says.`);
  }

  const doc = await loadPdfDocument(bytes);
  return {
    bytes,
    pageCount: doc.getPageCount(),
    rotations: doc.getPages().map((page) => page.getRotation().angle),
    sizes: doc.getPages().map((page) => {
      const { width, height } = page.getSize();
      return { width, height };
    }),
  };
}

/** A single document: split, rotate, extract, watermark, count. */
export function usePdfFile() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { bytes, pageCount, rotations, sizes } = await readPdfFile(file);
      setPdf({ file, bytes, pageCount, rotations, sizes });
    } catch (cause) {
      setPdf(null);
      setError(cause instanceof Error ? cause.message : "The PDF could not be opened.");
    } finally {
      setBusy(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPdf(null);
    setError(null);
  }, []);

  return { pdf, error, busy, load, clear, setError, setPdf };
}

/** Several documents in an order the visitor controls: merge, images to PDF. */
export function usePdfFiles() {
  const [entries, setEntries] = useState<PdfFileEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);
  // A live mirror of the list, so `add` can size the next batch against the real
  // length without reading possibly-stale state during an await.
  const lengthRef = useRef(0);

  useEffect(() => {
    lengthRef.current = entries.length;
  }, [entries]);

  const add = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);

    const added: PdfFileEntry[] = [];
    const problems: string[] = [];
    for (const file of files) {
      try {
        const { bytes, pageCount, rotations } = await readPdfFile(file);
        counter.current += 1;
        added.push({
          id: `pdf-${counter.current}`,
          name: file.name,
          size: file.size,
          bytes,
          pageCount,
          rotations,
        });
      } catch (cause) {
        problems.push(cause instanceof Error ? cause.message : `“${file.name}” could not be read.`);
      }
    }

    const room = Math.max(0, MAX_PDF_FILES - lengthRef.current);
    if (added.length > room) {
      problems.push(`Only ${MAX_PDF_FILES} files are handled at once, so ${added.length - room} were not added.`);
    }

    const accepted = added.slice(0, room);
    if (accepted.length > 0) {
      lengthRef.current += accepted.length;
      setEntries((prev) => prev.concat(accepted));
    }
    if (problems.length > 0) setError(problems.join(" "));
    setBusy(false);
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setEntries((prev) => {
      const index = prev.findIndex((entry) => entry.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    setError(null);
  }, []);

  return { entries, error, busy, add, move, remove, clear, setError };
}

/** The file, its size and its page count — the three facts worth repeating. */
export function PdfFacts({
  name,
  size,
  pageCount,
}: {
  name: string;
  size: number;
  pageCount: number;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
      <div className="min-w-0">
        <dt className="text-xs text-muted">File</dt>
        <dd className="truncate text-fg" title={name}>
          {name}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Pages</dt>
        <dd className="num text-fg">{pageCount}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Size</dt>
        <dd className="num text-fg">{formatBytes(size)}</dd>
      </div>
    </dl>
  );
}
