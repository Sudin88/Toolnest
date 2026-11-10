"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useImageFile } from "@/components/tools/image-workbench";
import { CopyButton, FileDrop } from "@/components/tools/interactive";
import { Empty, Note, SubHeading } from "@/components/tools/parts";
import { rgbToHex, rgbToHsl, type Rgb } from "@/lib/image";

const MAX_SWATCHES = 12;
const MAX_SAMPLE_PIXELS = 24_000_000;
const MAGNIFIER_PIXELS = 11;
const MAGNIFIER_ZOOM = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ImageColorPicker() {
  const { image, error, busy, load } = useImageFile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const magnifierRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [colour, setColour] = useState<Rgb | null>(null);
  const [swatches, setSwatches] = useState<string[]>([]);
  const [downscaled, setDownscaled] = useState(false);

  // Draw the source once per image, at natural size unless it is enormous.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const scale = Math.min(1, Math.sqrt(MAX_SAMPLE_PIXELS / (image.width * image.height)));
    const w = Math.max(1, Math.round(image.width * scale));
    const h = Math.max(1, Math.round(image.height * scale));
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = scale < 1;
    context.imageSmoothingQuality = "high";
    context.clearRect(0, 0, w, h);
    context.drawImage(image.bitmap, 0, 0, w, h);
    setDims({ w, h });
    setDownscaled(scale < 1);
    setCursor({ x: Math.floor(w / 2), y: Math.floor(h / 2) });
    setSwatches([]);
  }, [image]);

  // Sample the pixel under the cursor and refresh the magnifier with it.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !cursor) {
      setColour(null);
      return;
    }
    const data = context.getImageData(cursor.x, cursor.y, 1, 1).data;
    setColour({ r: data[0], g: data[1], b: data[2] });

    const magnifier = magnifierRef.current;
    const zoomContext = magnifier?.getContext("2d");
    if (!magnifier || !zoomContext) return;
    const half = Math.floor(MAGNIFIER_PIXELS / 2);
    magnifier.width = MAGNIFIER_PIXELS * MAGNIFIER_ZOOM;
    magnifier.height = MAGNIFIER_PIXELS * MAGNIFIER_ZOOM;
    zoomContext.imageSmoothingEnabled = false;
    zoomContext.clearRect(0, 0, magnifier.width, magnifier.height);
    zoomContext.drawImage(
      canvas,
      cursor.x - half,
      cursor.y - half,
      MAGNIFIER_PIXELS,
      MAGNIFIER_PIXELS,
      0,
      0,
      magnifier.width,
      magnifier.height,
    );
    const cell = MAGNIFIER_ZOOM;
    zoomContext.strokeStyle = "rgba(255,255,255,0.95)";
    zoomContext.lineWidth = 1;
    zoomContext.strokeRect(half * cell, half * cell, cell, cell);
    zoomContext.strokeStyle = "rgba(0,0,0,0.55)";
    zoomContext.strokeRect(half * cell - 0.5, half * cell - 0.5, cell + 1, cell + 1);
  }, [cursor]);

  const addSwatch = useCallback(() => {
    if (!colour) return;
    const hex = rgbToHex(colour);
    setSwatches((previous) => (previous.includes(hex) ? previous : [hex, ...previous].slice(0, MAX_SWATCHES)));
  }, [colour]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    setCursor({
      x: clamp(Math.floor((event.clientX - rect.left) * (canvas.width / rect.width)), 0, canvas.width - 1),
      y: clamp(Math.floor((event.clientY - rect.top) * (canvas.height / rect.height)), 0, canvas.height - 1),
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    if (!cursor || !dims) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      addSwatch();
      return;
    }
    const step = event.shiftKey ? 10 : 1;
    let { x, y } = cursor;
    if (event.key === "ArrowUp") y -= step;
    else if (event.key === "ArrowDown") y += step;
    else if (event.key === "ArrowLeft") x -= step;
    else if (event.key === "ArrowRight") x += step;
    else return;
    event.preventDefault();
    setCursor({ x: clamp(x, 0, dims.w - 1), y: clamp(y, 0, dims.h - 1) });
  }

  const hex = colour ? rgbToHex(colour) : null;
  const hsl = colour ? rgbToHsl(colour) : null;
  const rgbText = colour ? `rgb(${colour.r}, ${colour.g}, ${colour.b})` : "";
  const hslText = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : "";

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="Move the pointer to sample, click to lock a colour."
        accept="image/*"
        onFile={(files) => void load(files)}
      />

      {error ? <Note tone="warn">{error}</Note> : null}
      {busy ? <p className="text-sm text-muted">Decoding the image…</p> : null}

      {image ? (
        <>
          {downscaled ? (
            <Note>
              This image is very large, so sampling reads from a proportionally scaled working copy.
              Colours are averaged over the same area rather than read pixel-for-pixel.
            </Note>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
            <div className="flex flex-col gap-3">
              <div className="relative flex items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2 p-1">
                <div
                  className="absolute inset-0 opacity-60"
                  aria-hidden="true"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, var(--surface-3) 25%, transparent 25%), linear-gradient(-45deg, var(--surface-3) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--surface-3) 75%), linear-gradient(-45deg, transparent 75%, var(--surface-3) 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                  }}
                />
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    tabIndex={0}
                    aria-label="Image to sample colours from. Use the arrow keys to move the sample point and Enter to add the colour."
                    role="img"
                    onPointerMove={pointFromEvent}
                    onPointerDown={pointFromEvent}
                    onClick={addSwatch}
                    onKeyDown={onKeyDown}
                    className="cursor-crosshair touch-none rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "32rem" }}
                  />
                  {cursor && dims ? (
                    <span
                      className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
                      style={{
                        left: `${((cursor.x + 0.5) / dims.w) * 100}%`,
                        top: `${((cursor.y + 0.5) / dims.h) * 100}%`,
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted">
                Move with the pointer or the arrow keys (hold Shift for ten pixels), press Enter or
                click to keep a colour.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="panel p-4">
                <SubHeading>Sampled colour</SubHeading>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className="size-14 shrink-0 rounded-md border border-line"
                    style={{ backgroundColor: hex ?? "transparent" }}
                    aria-hidden="true"
                  />
                  <canvas
                    ref={magnifierRef}
                    className="size-14 rounded-md border border-line"
                    aria-label="Magnified pixels around the sample point"
                    role="img"
                  />
                </div>

                {colour && hex ? (
                  <dl className="mt-4 flex flex-col gap-3">
                    {[
                      { label: "HEX", value: hex },
                      { label: "RGB", value: rgbText },
                      { label: "HSL", value: hslText },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <dt className="text-xs text-muted">{row.label}</dt>
                          <dd className="field-mono truncate text-sm text-fg">{row.value}</dd>
                        </div>
                        <CopyButton value={row.value}>
                          <span className="sr-only">Copy {row.label} value</span>
                        </CopyButton>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-muted">Move over the image to sample a pixel.</p>
                )}

                <button
                  type="button"
                  className="btn btn-primary mt-4 w-full"
                  onClick={addSwatch}
                  disabled={!colour}
                >
                  Keep this colour
                </button>
              </div>

              <div className="panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <SubHeading>Palette ({swatches.length})</SubHeading>
                  {swatches.length > 0 ? (
                    <CopyButton value={swatches.join("\n")} label="Copy all" />
                  ) : null}
                </div>
                {swatches.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    Up to {MAX_SWATCHES} colours can be held at once.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {swatches.map((value) => (
                      <li key={value} className="flex items-center gap-2">
                        <span className="field-mono flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-fg">
                          <span
                            className="size-5 shrink-0 rounded border border-line"
                            style={{ backgroundColor: value }}
                            aria-hidden="true"
                          />
                          {value}
                        </span>
                        <CopyButton value={value}>
                          <span className="sr-only">Copy {value}</span>
                        </CopyButton>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSwatches((previous) => previous.filter((item) => item !== value))}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <Empty>Load an image and the sampling surface appears here.</Empty>
      )}

      <Note>
        Sampling reads the pixel data your browser decoded from the file, so the values are the true
        colours of the source rather than an approximation from a screenshot. HEX suits CSS and design
        tools, RGB when you need to set a channel numerically, and HSL when you want to reason about
        hue, saturation and lightness separately.
      </Note>
    </div>
  );
}
