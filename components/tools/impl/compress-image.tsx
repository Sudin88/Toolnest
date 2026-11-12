"use client";

import { useMemo, useState } from "react";

import {
  ImageFacts,
  ImagePreview,
  ImageStats,
  useImageFile,
  useImageResult,
} from "@/components/tools/image-workbench";
import { FileDrop, NumberInput, RangeInput, Select } from "@/components/tools/interactive";
import { Empty, Note } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas, savingsRatio } from "@/lib/image";

const FORMATS = [
  { value: "auto", label: "Same as the original" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG" },
];

export default function CompressImage() {
  const { image, url, error, busy, load, setError } = useImageFile();
  const [format, setFormat] = useState("auto");
  const [quality, setQuality] = useState(80);
  const [maxEdge, setMaxEdge] = useState<number | "">("");

  // A new source *or* a changed setting invalidates any previous result. The
  // memoised snapshot changes identity whenever an option does, and the result
  // hook drops the old preview with it, so the preview, the download filename
  // and the stats can never describe a blob built from older options.
  const settings = useMemo(
    () => ({ image, format, quality, maxEdge }),
    [image, format, quality, maxEdge],
  );

  const targetType =
    format !== "auto"
      ? format
      : ["image/jpeg", "image/png", "image/webp"].includes(image?.type ?? "")
        ? (image?.type as string)
        : "image/jpeg";
  const lossy = targetType !== "image/png";

  const { result: output, working, run, clear } = useImageResult(
    settings,
    async ({ image: source, quality: level, maxEdge: edge }) => {
      if (!source) throw new Error("The image could not be compressed.");
      const scale =
        edge === "" ? 1 : Math.min(1, Number(edge) / Math.max(source.width, source.height));
      const width = Math.max(1, Math.round(source.width * scale));
      const height = Math.max(1, Math.round(source.height * scale));
      const canvas = drawToCanvas(
        source.bitmap,
        width,
        height,
        targetType === "image/jpeg" ? "#ffffff" : undefined,
      );
      const blob = await canvasToBlob(canvas, targetType, lossy ? level / 100 : undefined);
      return { blob, meta: { width, height, type: targetType } };
    },
    setError,
    "The image could not be compressed.",
  );

  const saving = output && image ? Math.round((1 - savingsRatio(image.size, output.blob.size)) * 100) : 0;
  const filename = image ? `${baseName(image.name)}-compressed.${targetType.split("/")[1]}` : "image";

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="JPEG, PNG, WebP, GIF or AVIF — up to whatever your browser can decode."
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
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[0.9375rem] font-bold text-fg">Compressed</h3>
                {output ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={clear}
                  >
                    Clear result
                  </button>
                ) : null}
              </div>
              {output ? (
                <>
                  <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
                    <ImagePreview
                      src={output.url}
                      alt="Compressed result"
                      width={output.width}
                      height={output.height}
                    />
                  </div>
                  <ImageFacts
                    name={filename}
                    width={output.width}
                    height={output.height}
                    size={output.blob.size}
                    type={output.type}
                  />
                </>
              ) : (
                <Empty>Choose “Compress image” to see the result and its size.</Empty>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Select label="Output format" value={format} onChange={setFormat} options={FORMATS} />
            <RangeInput
              label="Quality"
              value={quality}
              onChange={setQuality}
              min={10}
              max={100}
              format={(value) => `${value}%`}
              className={lossy ? undefined : "opacity-50"}
            />
            <NumberInput
              label="Max longest edge (px)"
              value={maxEdge}
              onChange={setMaxEdge}
              min={16}
              step={10}
              hint="Blank keeps the original dimensions."
            />
          </div>

          {!lossy ? (
            <Note>
              PNG is lossless, so the quality slider does nothing and re-encoding often makes the
              file <em>larger</em>. Switch to JPEG or WebP for photographs, or rely on the resize
              control alone.
            </Note>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={working}>
              {working ? "Compressing…" : "Compress image"}
            </button>
            {output && image ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => downloadBlob(output.blob, filename)}
              >
                Download compressed
              </button>
            ) : null}
          </div>

          {output && image ? (
            <ImageStats
              before={{ size: image.size, type: image.type }}
              after={{ size: output.blob.size, type: output.type, width: output.width, height: output.height }}
              original={{ width: image.width, height: image.height }}
            />
          ) : null}

          {output && saving < 0 ? (
            <Note tone="warn">
              This result is larger than the original, so there is nothing to gain here. Keep the
              original file, or try a lossy format such as JPEG or WebP.
            </Note>
          ) : null}

          {output ? (
            <Note>
              The image was decoded and re-encoded by your browser. Nothing was uploaded, and no
              EXIF block survives the round trip — camera details and location data are gone.
            </Note>
          ) : null}
        </>
      ) : (
        <Note>Choose an image and the compression controls appear here. Nothing leaves your device.</Note>
      )}
    </div>
  );
}
