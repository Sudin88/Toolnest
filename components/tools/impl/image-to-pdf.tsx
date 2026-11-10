"use client";

import { PDFDocument } from "pdf-lib";
import { useMemo, useState } from "react";

import { ImagePreview, useImageFile } from "@/components/tools/image-workbench";
import { FileDrop, NumberInput, Select } from "@/components/tools/interactive";
import { Note, Stat, StatGrid, SubHeading } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas } from "@/lib/image";
import { formatBytes } from "@/lib/utils";

/** PDF points are 1/72 inch. */
const MM_TO_PT = 72 / 25.4;
const PDF_MAX = 14_400;

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

type Orientation = "portrait" | "landscape" | "auto";
type Fit = "contain" | "fill";

interface Geometry {
  pageW: number;
  pageH: number;
  drawW: number;
  drawH: number;
  x: number;
  y: number;
}

export default function ImageToPdf() {
  const { image, file, url, error, busy, load, setError } = useImageFile();
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fit, setFit] = useState<Fit>("contain");
  const [margin, setMargin] = useState<number | "">(10);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);

  // A new source invalidates any previous result. Adjusting state during render
  // is React's documented pattern for resetting on an input change, and it avoids
  // the extra render pass an effect would cost.
  const [blobSource, setBlobSource] = useState(image);
  if (blobSource !== image) {
    setBlobSource(image);
    setBlob(null);
  }

  const geometry = useMemo<Geometry | null>(() => {
    if (!image) return null;
    const marginPt = Math.max(0, typeof margin === "number" ? margin : 0) * MM_TO_PT;

    let pageW: number;
    let pageH: number;
    if (pageSize === "match") {
      pageW = image.width;
      pageH = image.height;
      const shrink = Math.min(1, PDF_MAX / Math.max(pageW, pageH));
      pageW *= shrink;
      pageH *= shrink;
    } else {
      const base = PAGE_SIZES[pageSize];
      const wantsLandscape =
        orientation === "landscape" || (orientation === "auto" && image.width > image.height);
      pageW = wantsLandscape ? base.height : base.width;
      pageH = wantsLandscape ? base.width : base.height;
    }

    const availW = Math.max(1, pageW - marginPt * 2);
    const availH = Math.max(1, pageH - marginPt * 2);
    const scale =
      fit === "contain"
        ? Math.min(availW / image.width, availH / image.height)
        : Math.max(availW / image.width, availH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    return { pageW, pageH, drawW, drawH, x, y };
  }, [image, pageSize, orientation, fit, margin]);

  async function build() {
    if (!image || !file || !geometry) return;
    setWorking(true);
    setError(null);
    try {
      const pdf = await PDFDocument.create();
      const bytes = new Uint8Array(await file.arrayBuffer());

      // pdf-lib embeds JPEG and PNG directly; anything else is rasterised to PNG.
      const embedded =
        image.type === "image/jpeg"
          ? await pdf.embedJpg(bytes)
          : await (async () => {
              const canvas = drawToCanvas(image.bitmap, image.width, image.height);
              const png = await canvasToBlob(canvas, "image/png");
              return pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
            })();

      const page = pdf.addPage([geometry.pageW, geometry.pageH]);
      page.drawImage(embedded, {
        x: geometry.x,
        y: geometry.y,
        width: geometry.drawW,
        height: geometry.drawH,
      });

      const output = await pdf.save();
      const bytesOut = new Uint8Array(output.length);
      bytesOut.set(output);
      setBlob(new Blob([bytesOut], { type: "application/pdf" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The PDF could not be built.");
    } finally {
      setWorking(false);
    }
  }

  const filename = image ? `${baseName(image.name)}.pdf` : "image.pdf";
  const pageLabel =
    pageSize === "match" ? "Matches the image" : `${pageSize === "a4" ? "A4" : "Letter"}, ${orientation}`;

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop an image here"
        hint="JPEG and PNG embed directly; other formats are rasterised to PNG first."
        accept="image/*"
        onFile={(files) => {
          setBlob(null);
          void load(files);
        }}
      />

      {error ? <Note tone="warn">{error}</Note> : null}
      {busy ? <p className="text-sm text-muted">Decoding the image…</p> : null}

      {image && geometry ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Page size"
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setBlob(null);
              }}
              options={[
                { value: "a4", label: "A4 (210 × 297 mm)" },
                { value: "letter", label: "Letter (8.5 × 11 in)" },
                { value: "match", label: "Match the image exactly" },
              ]}
            />
            <Select
              label="Orientation"
              value={orientation}
              onChange={(value) => {
                setOrientation(value as Orientation);
                setBlob(null);
              }}
              options={[
                { value: "portrait", label: "Portrait" },
                { value: "landscape", label: "Landscape" },
                { value: "auto", label: "Auto from the image" },
              ]}
              disabled={pageSize === "match"}
              hint={pageSize === "match" ? "The page follows the image." : undefined}
            />
            <Select
              label="Fit"
              value={fit}
              onChange={(value) => {
                setFit(value as Fit);
                setBlob(null);
              }}
              options={[
                { value: "contain", label: "Fit inside the page (no cropping)" },
                { value: "fill", label: "Fill the page (may crop edges)" },
              ]}
            />
            <NumberInput
              label="Margin (mm)"
              value={margin}
              onChange={(value) => {
                setMargin(value);
                setBlob(null);
              }}
              min={0}
              max={60}
              hint="Ignored when the page matches the image."
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="panel p-4">
              <SubHeading>Page preview</SubHeading>
              <div
                className="relative mx-auto mt-3 w-full max-w-[16rem] overflow-hidden rounded-sm border border-line bg-white"
                style={{ aspectRatio: `${geometry.pageW} / ${geometry.pageH}` }}
              >
                <div
                  className="absolute overflow-hidden"
                  style={{
                    left: `${(geometry.x / geometry.pageW) * 100}%`,
                    bottom: `${(geometry.y / geometry.pageH) * 100}%`,
                    width: `${(geometry.drawW / geometry.pageW) * 100}%`,
                    height: `${(geometry.drawH / geometry.pageH) * 100}%`,
                  }}
                >
                  <ImagePreview src={url} alt="Where the image sits on the page" className="size-full object-cover" />
                </div>
                {fit === "fill" ? (
                  <span className="absolute inset-0 border border-dashed border-highlight/60" aria-hidden="true" />
                ) : null}
              </div>
              <p className="mt-3 text-center text-xs text-muted">{pageLabel}</p>
            </div>

            <div className="flex flex-col gap-4">
              <StatGrid className="lg:grid-cols-2">
                <Stat label="Page" value={`${geometry.pageW.toFixed(1)} × ${geometry.pageH.toFixed(1)} pt`} hint={pageLabel} />
                <Stat label="Image on page" value={`${geometry.drawW.toFixed(1)} × ${geometry.drawH.toFixed(1)} pt`} hint={fit === "fill" ? "Cropped to fill" : "Contained, uncropped"} />
              </StatGrid>

              {fit === "fill" ? (
                <Note tone="warn">
                  Filling the page scales the image until it covers the paper, so the edges that spill
                  outside are cropped. Switch to “fit inside” if nothing may be lost.
                </Note>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-primary" onClick={build} disabled={working}>
                  {working ? "Building…" : "Build PDF"}
                </button>
                {blob ? (
                  <button type="button" className="btn btn-secondary" onClick={() => downloadBlob(blob, filename)}>
                    Download PDF
                  </button>
                ) : null}
              </div>

              {blob ? (
                <StatGrid className="lg:grid-cols-2">
                  <Stat label="PDF size" value={formatBytes(blob.size)} hint="Built in this tab" />
                  <Stat label="Pages" value="1" hint="One image, one page" />
                </StatGrid>
              ) : null}
            </div>
          </div>

          <Note>
            The page contains a picture of the image, not text, so nothing in it can be selected or
            searched. For a print-quality page you want roughly 300 pixels per inch — an A4 page wants
            about 2,480 pixels across. Everything is assembled by pdf-lib in the browser; the image is
            never uploaded.
          </Note>
        </>
      ) : (
        <Note>Load an image to choose a page size and see the layout. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
