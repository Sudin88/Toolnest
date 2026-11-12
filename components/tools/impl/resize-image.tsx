"use client";

import { useMemo, useState } from "react";

import {
  ImageFacts,
  ImagePreview,
  useImageFile,
  useImageResult,
} from "@/components/tools/image-workbench";
import { Check, FileDrop, NumberInput, RangeInput, Segmented, Select } from "@/components/tools/interactive";
import { Empty, Note, Stat, StatGrid } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas } from "@/lib/image";
import { formatBytes, formatNumber } from "@/lib/utils";

type Mode = "pixels" | "percent";
type Grade = "low" | "medium" | "high";

const MAX_SIDE = 16_384;
const MAX_AREA = 268_000_000;

const encodable = (type: string) =>
  ["image/jpeg", "image/png", "image/webp"].includes(type) ? type : "image/png";

export default function ResizeImage() {
  const { image, error, busy, load, setError } = useImageFile();
  const [mode, setMode] = useState<Mode>("pixels");
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [locked, setLocked] = useState(true);
  const [percent, setPercent] = useState(100);
  const [grade, setGrade] = useState<Grade>("high");

  // A new source re-seeds the fields. Done during render rather than in an
  // effect: it is state derived from an input change, so React's own pattern
  // applies and no extra pass is needed.
  const [source, setSource] = useState(image);
  if (source !== image) {
    setSource(image);
    if (image) {
      setWidth(image.width);
      setHeight(image.height);
      setPercent(100);
    }
  }

  const target = (() => {
    if (!image) return null;
    if (mode === "percent") {
      return {
        width: Math.max(1, Math.round((image.width * percent) / 100)),
        height: Math.max(1, Math.round((image.height * percent) / 100)),
      };
    }
    return {
      width: Math.max(1, Math.round(typeof width === "number" ? width : image.width)),
      height: Math.max(1, Math.round(typeof height === "number" ? height : image.height)),
    };
  })();

  function onWidthChange(value: number | "") {
    setWidth(value);
    if (locked && image && typeof value === "number" && value > 0) {
      setHeight(Math.max(1, Math.round((value * image.height) / image.width)));
    }
  }

  function onHeightChange(value: number | "") {
    setHeight(value);
    if (locked && image && typeof value === "number" && value > 0) {
      setWidth(Math.max(1, Math.round((value * image.width) / image.height)));
    }
  }

  const oversize = target ? target.width > MAX_SIDE || target.height > MAX_SIDE || target.width * target.height > MAX_AREA : false;

  // A change to the source or to any control that shapes the output invalidates
  // a previous result. The hook drops the old preview with it, so the filename
  // — built from the live `target` — can never describe a blob that has
  // different dimensions.
  const settings = useMemo(
    () => ({ image, mode, width, height, percent, grade }),
    [image, mode, width, height, percent, grade],
  );
  const { result: output, working, run, clear } = useImageResult(
    settings,
    async () => {
      if (!image || !target) throw new Error("The image could not be resized.");
      const canvas = drawToCanvas(image.bitmap, target.width, target.height, undefined, grade);
      const type = encodable(image.type);
      const blob = await canvasToBlob(canvas, type, type === "image/png" ? undefined : 0.92);
      return { blob, meta: { width: target.width, height: target.height } };
    },
    setError,
    "The image could not be resized.",
  );

  const filename = image
    ? `${baseName(image.name)}-${target?.width ?? 0}x${target?.height ?? 0}.${encodable(image.type).split("/")[1]}`
    : "image";

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="Its current dimensions are read from the file itself."
        accept="image/*"
        onFile={(files) => {
          clear();
          void load(files);
        }}
      />

      {error ? <Note tone="warn">{error}</Note> : null}
      {busy ? <p className="text-sm text-muted">Decoding the image…</p> : null}

      {image && target ? (
        <>
          <ImageFacts
            name={image.name}
            width={image.width}
            height={image.height}
            size={image.size}
            type={image.type}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Segmented<Mode>
              label="Resize by"
              value={mode}
              onChange={setMode}
              options={[
                { value: "pixels", label: "Exact pixels" },
                { value: "percent", label: "Percentage" },
              ]}
            />
            <Select
              label="Resampling"
              value={grade}
              onChange={(value) => setGrade(value as Grade)}
              options={[
                { value: "high", label: "High quality (smoother, slower)" },
                { value: "medium", label: "Balanced" },
                { value: "low", label: "Low quality (nearest-ish, fastest)" },
              ]}
            />
          </div>

          {mode === "pixels" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberInput label="Width (px)" value={width} onChange={onWidthChange} min={1} max={MAX_SIDE} />
              <NumberInput label="Height (px)" value={height} onChange={onHeightChange} min={1} max={MAX_SIDE} />
              <div className="sm:col-span-2">
                <Check
                  label="Lock the aspect ratio"
                  checked={locked}
                  onChange={setLocked}
                  hint="While locked, editing one side recalculates the other."
                />
              </div>
            </div>
          ) : (
            <RangeInput
              label="Scale"
              value={percent}
              onChange={setPercent}
              min={1}
              max={400}
              format={(value) => `${value}%`}
            />
          )}

          <StatGrid className="lg:grid-cols-3">
            <Stat label="Current" value={`${image.width} × ${image.height}`} hint={formatNumber(image.width * image.height) + " pixels"} />
            <Stat label="New size" value={`${target.width} × ${target.height}`} hint={formatNumber(target.width * target.height) + " pixels"} />
            <Stat
              label="Scale"
              value={`${Math.round((target.width / image.width) * 100)}%`}
              hint={target.width > image.width ? "Enlarging: detail will not be invented" : "Reducing"}
            />
          </StatGrid>

          {oversize ? (
            <Note tone="warn">
              That exceeds the browser&rsquo;s maximum canvas size (about {formatNumber(MAX_SIDE)} pixels on a
              side). Reduce the dimensions.
            </Note>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={working || oversize}>
              {working ? "Resizing…" : "Resize image"}
            </button>
            {output ? (
              <button type="button" className="btn btn-secondary" onClick={() => downloadBlob(output.blob, filename)}>
                Download resized
              </button>
            ) : null}
          </div>

          {output ? (
            <div className="panel flex flex-col gap-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[0.9375rem] font-bold text-fg">Result</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>
                  Clear result
                </button>
              </div>
              <div className="flex max-h-80 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
                <ImagePreview
                  src={output.url}
                  alt="Resized result"
                  width={output.width}
                  height={output.height}
                />
              </div>
              <p className="num text-xs text-muted">
                {output.width} × {output.height} · {formatBytes(output.blob.size)}
              </p>
            </div>
          ) : (
            <Empty>Choose a size, then resize. The preview and download appear here.</Empty>
          )}

          <Note>
            Re-encoding through the Canvas API drops the EXIF block, so camera details and GPS
            coordinates are removed. Enlarging cannot add detail: smooth resampling avoids the worst
            jaggedness but the result will look softer than a native image at that size.
          </Note>
        </>
      ) : (
        <Note>Load an image and its dimensions appear here. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
