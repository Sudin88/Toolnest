"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_BATCH_BYTES,
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

interface LoadedPdf {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
  /** Each page's own rotation as stored in the file, for an honest preview. */
  rotations: number[];
  /** Each page's box in points, for page-shaped previews. */
  sizes: { width: number; height: number }[];
}

interface PdfFileEntry {
  id: string;
  name: string;
  size: number;
  bytes: Uint8Array;
  pageCount: number;
  rotations: number[];
}

/** Give the browser a frame to paint the spinner before the heavy work starts. */
const yieldToPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * A wall-clock ceiling on one document read. pdf-lib yields while it parses, so
 * a pathologically large or damaged file can otherwise leave the tool "busy"
 * forever with nothing on screen to explain it.
 */
const READ_TIMEOUT_MS = 20_000;

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("That document is taking too long to read. It may be very large or unusually complex: try a smaller file."));
    }, READ_TIMEOUT_MS);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (cause: unknown) => {
        clearTimeout(timer);
        reject(cause);
      },
    );
  });
}

async function readPdfFile(file: File): Promise<{
  bytes: Uint8Array;
  pageCount: number;
  rotations: number[];
  sizes: { width: number; height: number }[];
}> {
  const problem = validatePdfFile(file);
  if (problem) throw new Error(problem);

  // Let the busy state render before the synchronous parse begins.
  await yieldToPaint();

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(bytes)) {
    throw new Error(`“${file.name}” is not a PDF. The %PDF- header is missing, whatever the name says.`);
  }

  const doc = await withTimeout(loadPdfDocument(bytes));
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
  // length and total size without reading possibly-stale state during an await.
  const lengthRef = useRef(0);
  const bytesRef = useRef(0);

  useEffect(() => {
    lengthRef.current = entries.length;
    bytesRef.current = entries.reduce((sum, entry) => sum + entry.size, 0);
  }, [entries]);

  const add = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);

    // Size the batch against both limits *before* reading anything, so a large
    // drop parses only what fits and reports the rest rather than parsing it all
    // and then discarding most of it.
    const room = Math.max(0, MAX_PDF_FILES - lengthRef.current);
    if (room === 0) {
      setError(`Only ${MAX_PDF_FILES} files are handled at once. Remove one before adding more.`);
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

    const added: PdfFileEntry[] = [];
    const problems: string[] = [];
    for (const file of batch) {
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

    if (overCount > 0) {
      problems.push(`Only ${MAX_PDF_FILES} files are handled at once, so ${overCount} were not added.`);
    }
    if (overSize > 0) {
      problems.push(
        `The combined size is limited to ${formatBytes(MAX_BATCH_BYTES)}, so ${overSize} ${overSize === 1 ? "file was" : "files were"} not added.`,
      );
    }

    if (added.length > 0) {
      lengthRef.current += added.length;
      bytesRef.current += added.reduce((sum, entry) => sum + entry.size, 0);
      setEntries((prev) => prev.concat(added));
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

interface PdfBuild<TResult> {
  /** True while a build is in flight. */
  working: boolean;
  /** The last build's failure, or `null`. */
  error: string | null;
  /** The last successful result, cleared the moment its inputs change. */
  result: TResult | null;
  /** Run `build` against the current source. */
  run(): void;
  /** Drop the current result and error. */
  reset(): void;
}

/**
 * The build half of every PDF tool: run one async builder over a snapshot of the
 * tool's inputs, show a spinner, and surface a failure in words.
 *
 * The snapshot is the whole invalidation story. Whenever any input changes, the
 * caller passes a new `source` identity, and a result built from the old one is
 * dropped **during that render** — not in an effect — so a download can never be
 * clicked against a document that no longer matches the controls on screen. A
 * build that finishes after its inputs were replaced is discarded the same way,
 * which is why nothing may be derived from a build except through its returned
 * result: the result and its side-products must arrive together or not at all.
 *
 * This is the one shared piece the five PDF tools had each written out by hand.
 */
export function usePdfBuild<TInput, TResult = Blob>(
  source: TInput,
  build: (source: TInput) => Promise<TResult>,
  errorMessage: string,
): PdfBuild<TResult> {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  // Drop a stale result during the render that first sees the new source.
  const [built, setBuilt] = useState(source);
  if (built !== source) {
    setBuilt(source);
    setResult(null);
    setError(null);
  }

  // Read through refs so `run` is stable, and so a build that outlives its
  // inputs can tell that it is no longer current.
  const sourceRef = useRef(source);
  const buildRef = useRef(build);
  useEffect(() => {
    sourceRef.current = source;
    buildRef.current = build;
  });

  const run = useCallback(async () => {
    const used = sourceRef.current;
    setWorking(true);
    setError(null);
    setResult(null);
    try {
      const built = await buildRef.current(used);
      if (sourceRef.current !== used) return;
      setResult(built);
    } catch (cause) {
      if (sourceRef.current !== used) return;
      setError(cause instanceof Error ? cause.message : errorMessage);
    } finally {
      setWorking(false);
    }
  }, [errorMessage]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { working, error, result, run, reset };
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
