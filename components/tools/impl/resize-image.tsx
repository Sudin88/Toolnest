"use client";

import { useEffect, useState } from "react";

import { ImageFacts, ImagePreview, useImageFile } from "@/components/tools/image-workbench";
import { Check, FileDrop, NumberInput, RangeInput, Select } from "@/components/tools/interactive";
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

interface Output {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export default function ResizeImage() {
  const { image, url, error, busy, load, setError } = useImageFile();
  const [mode, setMode] = useState<Mode>("pixels");
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [locked, setLocked] = useState(true);
  const [percent, setPercent] = useState(100);
  const [grade, setGrade] = useState<Grade>("high");
  const [output, setOutput] = useState<Output | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!image) return;
    setWidth(image.width);
    setHeight(image.height);
    setPercent(100);
    setOutput(null);
  }, [image]);

  useEffect(() => {
    if (!output) return;
    return () => URL.revokeObjectURL(output.url);
  }, [output]);

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

  async function resize() {
    if (!image || !target) return;
    if (oversize) {
      setError("That is larger than the browser can draw. Reduce the dimensions.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const canvas = drawToCanvas(image.bitmap, target.width, target.height, undefined, grade);
      const type = encodable(image.type);
      const blob = await canvasToBlob(canvas, type, type === "image/png" ? undefined : 0.92);
      setOutput({ blob, url: URL.createObjectURL(blob), width: target.width, height: target.height });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be resized.");
    } finally {
      setWorking(false);
    }
  }

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
          setOutput(null);
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
            <div>
              <span className="label">Resize by</span>
              <div role="group" aria-label="Resize mode" className="inline-flex gap-1 rounded-md border border-line bg-surface-2 p-1">
                {(["pixels", "percent"] as Mode[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out ${
                      mode === value ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg"
                    }`}
                  >
                    {value === "pixels" ? "Exact pixels" : "Percentage"}
                  </button>
                ))}
              </div>
            </div>
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
              hint={target.width > image.width ? "Enlarging — detail will not be invented" : "Reducing"}
            />
          </StatGrid>

          {oversize ? (
            <Note tone="warn">
              That exceeds the browser&rsquo;s maximum canvas size (about {formatNumber(MAX_SIDE)} pixels on a
              side). Reduce the dimensions.
            </Note>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={resize} disabled={working || oversize}>
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
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOutput(null)}>
                  Clear result
                </button>
              </div>
              <div className="flex max-h-80 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
                <ImagePreview src={output.url} alt="Resized result" />
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
            coordinates are removed. Enlarging cannot add detail — smooth resampling avoids the worst
            jaggedness but the result will look softer than a native image at that size.
          </Note>
        </>
      ) : (
        <Note>Load an image and its dimensions appear here. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
