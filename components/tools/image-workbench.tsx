"use client";

import { useCallback, useState } from "react";

import { useObjectUrl } from "@/components/tools/interactive";
import { formatLabel, loadImageFile, type LoadedImage } from "@/lib/image";
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

export function ImagePreview({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // Blob and data URLs are already local, so next/image would add nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
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
