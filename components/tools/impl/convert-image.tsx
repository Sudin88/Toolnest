"use client";

import { useMemo, useState } from "react";

import {
  ImageFacts,
  ImagePreview,
  ImageStats,
  useImageFile,
  useImageResult,
} from "@/components/tools/image-workbench";
import { FileDrop, RangeInput, Select } from "@/components/tools/interactive";
import { Empty, Note } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas, formatLabel, mayHaveAlpha } from "@/lib/image";
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

export default function ConvertImage() {
  const { image, url, error, busy, load, setError } = useImageFile();
  const [target, setTarget] = useState("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [matte, setMatte] = useState("#ffffff");

  // A new source *or* a changed setting invalidates any previous result. The
  // memoised snapshot changes identity whenever an option does, and the result
  // hook drops the old preview with it, so the filename (`EXT[target]`) and the
  // stats can never describe a blob built from older options.
  const settings = useMemo(
    () => ({ image, target, quality, matte }),
    [image, target, quality, matte],
  );
  const { result: output, working, run, clear } = useImageResult(
    settings,
    async ({ image: source, target: type, quality: level, matte: fill }) => {
      if (!source) throw new Error("Load an image first.");
      const canvas = drawToCanvas(
        source.bitmap,
        source.width,
        source.height,
        type === "image/jpeg" ? fill : undefined,
      );
      const blob = await canvasToBlob(canvas, type, type !== "image/png" ? level / 100 : undefined);
      return { blob, meta: { type } };
    },
    setError,
    "The image could not be converted.",
  );

  const lossy = target !== "image/png";
  const transparencyAtRisk = target === "image/jpeg" && mayHaveAlpha(image?.type ?? "");
  const filename = image ? `${baseName(image.name)}.${EXT[target]}` : "image";

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="The format is detected from the file itself, not the extension."
        accept="image/*"
        onFile={(files) => {
          clear();
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
                <ImagePreview
                  src={url}
                  alt={`Original: ${image.name}`}
                  width={image.width}
                  height={image.height}
                />
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
                    <ImagePreview
                      src={output.url}
                      alt="Converted result"
                      width={image.width}
                      height={image.height}
                    />
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
                <Empty>Choose “Convert image” to see the result.</Empty>
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
            <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={working}>
              {working ? "Converting…" : "Convert image"}
            </button>
            {output ? (
              <button type="button" className="btn btn-secondary" onClick={() => downloadBlob(output.blob, filename)}>
                Download {EXT[target].toUpperCase()}
              </button>
            ) : null}
          </div>

          {output ? (
            <ImageStats
              before={{ size: image.size, type: image.type }}
              after={{ size: output.blob.size, type: output.type, width: image.width, height: image.height }}
              original={{ width: image.width, height: image.height }}
            />
          ) : null}
        </>
      ) : (
        <Note>Load an image to see its detected format and convert it. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
