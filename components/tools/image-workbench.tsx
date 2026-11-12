"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useObjectUrl } from "@/components/tools/interactive";
import { Stat, StatGrid } from "@/components/tools/parts";
import { formatLabel, loadImageFile, savingsRatio, type LoadedImage } from "@/lib/image";
import { formatBytes } from "@/lib/utils";

/**
 * Every image tool opens a file the same way: decode it, keep the original for
 * preview and size comparison, and surface a readable error when it fails. This
 * hook is that shared step so six tools do not each re-implement it.
 */
export function useImageFile() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (files: File[]) => {
    const next = files[0];
    if (!next) return;
    setBusy(true);
    setError(null);
    try {
      const loaded = await loadImageFile(next);
      setImage(loaded);
      setFile(next);
    } catch (cause) {
      setImage(null);
      setFile(null);
      setError(cause instanceof Error ? cause.message : "The image could not be opened.");
    } finally {
      setBusy(false);
    }
  }, []);

  const clear = useCallback(() => {
    setImage(null);
    setFile(null);
    setError(null);
  }, []);

  const url = useObjectUrl(file);

  return { image, file, url, error, busy, load, clear, setError };
}

/** A produced image: its bytes, the preview URL, and whatever the tool needs to
 * describe it (dimensions, format). The metadata is flattened onto the result so
 * callers read `result.width` rather than `result.meta.width`. */
export type ImageResult<TMeta> = TMeta & { blob: Blob; url: string };

/**
 * The build half of the image tools: run one async producer over a snapshot of
 * the tool's controls, keep the resulting blob and its object URL, and revoke
 * that URL the moment the result is replaced or the tool unmounts.
 *
 * A new `source` identity — the tool's controls in one memoised object — drops a
 * previous result during the render that first sees it, and a producer that
 * finishes after its controls moved is discarded too, so a preview and its
 * download can never describe a document built from stale settings. Nothing may
 * be derived from a build except through its returned result: the result and its
 * metadata arrive together or not at all.
 */
export function useImageResult<TInput, TMeta>(
  source: TInput,
  produce: (source: TInput) => Promise<{ blob: Blob; meta: TMeta }>,
  onError: (message: string) => void,
  fallbackError: string,
): {
  result: ImageResult<TMeta> | null;
  working: boolean;
  run(): void;
  clear(): void;
} {
  const [result, setResult] = useState<ImageResult<TMeta> | null>(null);
  const [working, setWorking] = useState(false);

  // Drop a stale result during the render that first sees the new source.
  const [built, setBuilt] = useState(source);
  if (built !== source) {
    setBuilt(source);
    setResult(null);
  }

  // Revoke the preview URL when the result is replaced or the tool unmounts.
  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  // Read through refs so `run` is stable, and so a build that outlives its
  // controls can tell that it is no longer current.
  const sourceRef = useRef(source);
  const produceRef = useRef(produce);
  useEffect(() => {
    sourceRef.current = source;
    produceRef.current = produce;
  });

  const run = useCallback(async () => {
    const used = sourceRef.current;
    setWorking(true);
    try {
      const made = await produceRef.current(used);
      if (sourceRef.current !== used) return;
      setResult({ ...made.meta, blob: made.blob, url: URL.createObjectURL(made.blob) });
    } catch (cause) {
      if (sourceRef.current !== used) return;
      onError(cause instanceof Error ? cause.message : fallbackError);
    } finally {
      setWorking(false);
    }
  }, [onError, fallbackError]);

  const clear = useCallback(() => setResult(null), []);

  return { result, working, run, clear };
}

export function ImagePreview({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string | null;
  alt: string;
  className?: string;
  /** The decoded image's own size, used to reserve the box before it decodes. */
  width?: number;
  height?: number;
}) {
  if (!src) return null;
  return (
    // Blob and data URLs are already local, so next/image would add nothing here.
    // With `width`/`height` the browser knows the aspect ratio from the markup,
    // so the box is the right shape before the bytes arrive and nothing jumps.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={{
        maxWidth: "100%",
        height: "auto",
        ...(width && height ? { aspectRatio: `${width} / ${height}` } : {}),
      }}
    />
  );
}

export function ImageFacts({
  name,
  width,
  height,
  size,
  type,
}: {
  name: string;
  width: number;
  height: number;
  size: number;
  type: string;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
      <div className="min-w-0">
        <dt className="text-xs text-muted">File</dt>
        <dd className="truncate text-fg" title={name}>
          {name}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Dimensions</dt>
        <dd className="num text-fg">
          {width} × {height}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Format</dt>
        <dd className="text-fg">{formatLabel(type)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Size</dt>
        <dd className="num text-fg">{formatBytes(size)}</dd>
      </div>
    </dl>
  );
}

/**
 * The four facts every image tool reports about a finished conversion: what came
 * in, what came out, how much that changed by, and whether the dimensions moved.
 * One component so the before/after wording, the saved-versus-grew label and the
 * “unchanged”/“resized” hint cannot drift between tools.
 */
export function ImageStats({
  before,
  after,
  original,
}: {
  before: { size: number; type: string };
  after: { size: number; type: string; width: number; height: number };
  /** The source's dimensions, to tell an unchanged image from a resized one. */
  original: { width: number; height: number };
}) {
  const saving = Math.round((1 - savingsRatio(before.size, after.size)) * 100);
  const unchanged = after.width === original.width && after.height === original.height;
  return (
    <StatGrid>
      <Stat label="Before" value={formatBytes(before.size)} hint={formatLabel(before.type)} />
      <Stat label="After" value={formatBytes(after.size)} hint={formatLabel(after.type)} />
      <Stat
        label={saving >= 0 ? "Saved" : "Grew by"}
        value={`${Math.abs(saving)}%`}
        hint={saving >= 0 ? "Smaller than the original" : "The original is the better file"}
      />
      <Stat
        label="Dimensions"
        value={`${after.width} × ${after.height}`}
        hint={unchanged ? "Unchanged" : "Resized"}
      />
    </StatGrid>
  );
}
