"use client";

import { PDFDocument } from "pdf-lib";
import { useMemo, useState } from "react";

import { useImageFile } from "@/components/tools/image-workbench";
import { PageSetupControls, PageSetupPreview, type PageSetup } from "@/components/tools/impl/images-to-pdf-panels";
import { FileDrop } from "@/components/tools/interactive";
import { Note, Stat, StatGrid } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas } from "@/lib/image";
import { imagePageGeometry } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

export default function ImageToPdf() {
  const { image, file, url, error, busy, load, setError } = useImageFile();
  const [setup, setSetup] = useState<PageSetup>({
    pageSize: "a4",
    orientation: "portrait",
    fit: "contain",
    margin: 10,
  });
  const [blob, setBlob] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);

  const { pageSize, orientation, fit, margin } = setup;

  // Any change to the page setup drops a document built from the old one, so a
  // download can never save a page that no longer matches the controls on screen.
  function applySetup(patch: Partial<PageSetup>) {
    setSetup((current) => ({ ...current, ...patch }));
    setBlob(null);
  }

  // A new source invalidates any previous result. Adjusting state during render
  // is React's documented pattern for resetting on an input change, and it avoids
  // the extra render pass an effect would cost.
  const [blobSource, setBlobSource] = useState(image);
  if (blobSource !== image) {
    setBlobSource(image);
    setBlob(null);
  }

  // One geometry for the page the image will land on, from the same shared
  // function the multi-image tool uses — so the two tools cannot disagree about
  // where an image sits or whether a "fill" crops it.
  const geometry = useMemo(
    () =>
      image
        ? imagePageGeometry({
            imageWidth: image.width,
            imageHeight: image.height,
            pageSize,
            orientation,
            fit,
            marginMm: typeof margin === "number" ? margin : 0,
          })
        : null,
    [image, pageSize, orientation, fit, margin],
  );

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
          <PageSetupControls value={setup} onChange={applySetup} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <PageSetupPreview
              entry={{ name: image.name, url: url ?? "", width: image.width }}
              geometry={geometry}
              pageLabel={pageLabel}
            />

            <div className="flex flex-col gap-4">
              <StatGrid className="lg:grid-cols-2">
                <Stat label="Page" value={`${geometry.pageW.toFixed(1)} × ${geometry.pageH.toFixed(1)} pt`} hint={pageLabel} />
                <Stat label="Image on page" value={`${geometry.drawW.toFixed(1)} × ${geometry.drawH.toFixed(1)} pt`} hint={geometry.cropped ? "Edges cropped to fill" : fit === "fill" ? "Filled, uncropped" : "Contained, uncropped"} />
              </StatGrid>

              {geometry.cropped ? (
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
            searched. For a print-quality page you want roughly 300 pixels per inch: an A4 page wants
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
