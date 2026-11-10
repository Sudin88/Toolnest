"use client";

import { useEffect, useState } from "react";

import { ImageFacts, ImagePreview, useImageFile } from "@/components/tools/image-workbench";
import { FileDrop, RangeInput, Select } from "@/components/tools/interactive";
import { Empty, Note, Stat, StatGrid } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import {
  baseName,
  canvasToBlob,
  drawToCanvas,
  formatLabel,
  mayHaveAlpha,
  savingsRatio,
} from "@/lib/image";
import { formatBytes } from "@/lib/utils";

const TARGETS = [
  { value: "image/jpeg", label: "JPEG — photographs" },
  { value: "image/png", label: "PNG — transparency and lossless detail" },
  { value: "image/webp", label: "WebP — smallest for the web" },
];

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface Output {
  blob: Blob;
  url: string;
  type: string;
}

export default function ConvertImage() {
  const { image, url, error, busy, load, setError } = useImageFile();
  const [target, setTarget] = useState("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [matte, setMatte] = useState("#ffffff");
  const [output, setOutput] = useState<Output | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setOutput(null);
  }, [image]);

  useEffect(() => {
    if (!output) return;
    return () => URL.revokeObjectURL(output.url);
  }, [output]);

  const lossy = target !== "image/png";
  const transparencyAtRisk = target === "image/jpeg" && mayHaveAlpha(image?.type ?? "");

  async function convert() {
    if (!image) return;
    setWorking(true);
    setError(null);
    try {
      const canvas = drawToCanvas(
        image.bitmap,
        image.width,
        image.height,
        target === "image/jpeg" ? matte : undefined,
      );
      const blob = await canvasToBlob(canvas, target, lossy ? quality / 100 : undefined);
      setOutput({ blob, url: URL.createObjectURL(blob), type: target });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be converted.");
    } finally {
      setWorking(false);
    }
  }

  const ratio = output && image ? savingsRatio(image.size, output.blob.size) : null;
  const saving = ratio === null ? 0 : Math.round((1 - ratio) * 100);
  const filename = image ? `${baseName(image.name)}.${EXT[target]}` : "image";

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="The format is detected from the file itself, not the extension."
        accept="image/*"
        onFile={(files) => {
          setOutput(null);
          void load(files);
        }}
      />

      {error ? <Note tone="warn">{error}</Note> : null}
      {busy ? <p className="text-sm text-muted">Decoding the image…</p> : null}

      {image ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel flex flex-col gap-4 p-4">
              <h3 className="font-display text-[0.9375rem] font-bold text-fg">Original</h3>
              <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
                <ImagePreview src={url} alt={`Original: ${image.name}`} />
              </div>
              <ImageFacts
                name={image.name}
                width={image.width}
                height={image.height}
                size={image.size}
                type={image.type}
              />
            </div>

            <div className="panel flex flex-col gap-4 p-4">
              <h3 className="font-display text-[0.9375rem] font-bold text-fg">Converted</h3>
              {output ? (
                <>
                  <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
                    <ImagePreview src={output.url} alt="Converted result" />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div>
                      <dt className="text-xs text-muted">Format</dt>
                      <dd className="text-fg">{formatLabel(output.type)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Size</dt>
                      <dd className="num text-fg">{formatBytes(output.blob.size)}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <Empty>Press convert to see the result.</Empty>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Convert to" value={target} onChange={setTarget} options={TARGETS} />
            <RangeInput
              label="Quality"
              value={quality}
              onChange={setQuality}
              min={10}
              max={100}
              format={(value) => `${value}%`}
              className={lossy ? undefined : "opacity-50"}
            />
            {target === "image/jpeg" ? (
              <div>
                <label className="label" htmlFor="matte-colour">
                  Matte colour for transparency
                </label>
                <input
                  id="matte-colour"
                  type="color"
                  value={matte}
                  onChange={(event) => setMatte(event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface-2 p-1"
                />
              </div>
            ) : null}
          </div>

          {transparencyAtRisk ? (
            <Note tone="warn">
              This image may contain transparent areas, and JPEG has no alpha channel — they will be
              filled with the matte colour above. Choose PNG or WebP if you need to keep transparency.
            </Note>
          ) : null}

          {!lossy ? (
            <Note>
              PNG is lossless, so the quality slider does nothing and the file will usually be larger
              than a JPEG or WebP of the same image. It is the right choice for transparency and
              screenshots, not for shrinking a photograph.
            </Note>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={convert} disabled={working}>
              {working ? "Converting…" : "Convert image"}
            </button>
            {output ? (
              <button type="button" className="btn btn-secondary" onClick={() => downloadBlob(output.blob, filename)}>
                Download {EXT[target].toUpperCase()}
              </button>
            ) : null}
          </div>

          {output ? (
            <StatGrid>
              <Stat label="Before" value={formatBytes(image.size)} hint={formatLabel(image.type)} />
              <Stat label="After" value={formatBytes(output.blob.size)} hint={formatLabel(output.type)} />
              <Stat
                label={saving >= 0 ? "Saved" : "Grew by"}
                value={`${Math.abs(saving)}%`}
                hint={saving >= 0 ? "Smaller than the original" : "The original is the better file"}
              />
              <Stat label="Dimensions" value={`${image.width} × ${image.height}`} hint="Unchanged" />
            </StatGrid>
          ) : null}
        </>
      ) : (
        <Note>Load an image to see its detected format and convert it. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
