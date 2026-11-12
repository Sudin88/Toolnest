"use client";

import { PDFDocument } from "pdf-lib";
import { useCallback, useMemo, useState } from "react";

import { useImageBatch } from "@/components/tools/image-batch";
import { PageSetupControls, PageSetupPreview, type PageSetup } from "@/components/tools/impl/images-to-pdf-panels";
import { FileDrop, FileList } from "@/components/tools/interactive";
import { Note, ResultFooter, Stat, StatGrid } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas } from "@/lib/image";
import { imagePageGeometry } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

/**
 * Many images into one document, one image per page.
 *
 * This is the multi-file sibling of Image to PDF: that tool tunes a single page,
 * this one repeats a page setup down a list. JPEG and PNG are embedded as they
 * are, so nothing is re-encoded; anything else the browser can decode is
 * rasterised to PNG first, which is why the note about quality is honest rather
 * than blanket.
 *
 * The batch itself lives in `useImageBatch` and the page controls and preview in
 * `images-to-pdf-panels`, so this file keeps only the build and the results.
 */
export default function ImagesToPdf() {
  const [buildError, setBuildError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [setup, setSetup] = useState<PageSetup>({
    pageSize: "a4",
    orientation: "portrait",
    fit: "contain",
    margin: 10,
  });

  // Any change to the batch or to the page setup drops a document built from the
  // old inputs, so a download can never save pages that no longer match the list
  // on screen.
  const reset = useCallback(() => {
    setBlob(null);
    setBuildError(null);
  }, []);
  const { entries, error, busy, add, move, remove, clear } = useImageBatch(reset);

  const { pageSize, orientation, fit, margin } = setup;
  const applySetup = useCallback(
    (patch: Partial<PageSetup>) => {
      setSetup((current) => ({ ...current, ...patch }));
      reset();
    },
    [reset],
  );

  const marginMm = typeof margin === "number" ? margin : 0;

  // The page preview shows the first image's setup, which is the one the four
  // controls most obviously affect. Per-image geometry is computed during build.
  const geometry = useMemo(() => {
    const first = entries[0];
    if (!first) return null;
    return imagePageGeometry({
      imageWidth: first.image.width,
      imageHeight: first.image.height,
      pageSize,
      orientation,
      fit,
      marginMm,
    });
  }, [entries, pageSize, orientation, fit, marginMm]);

  async function build() {
    if (entries.length === 0 || !geometry) return;
    setWorking(true);
    setBuildError(null);
    setBlob(null);
    try {
      const pdf = await PDFDocument.create();

      for (const entry of entries) {
        const geometryForPage = imagePageGeometry({
          imageWidth: entry.image.width,
          imageHeight: entry.image.height,
          pageSize,
          orientation,
          fit,
          marginMm,
        });

        // pdf-lib embeds JPEG and PNG directly; anything else is rasterised.
        const embedded =
          entry.image.type === "image/jpeg"
            ? await pdf.embedJpg(new Uint8Array(await entry.file.arrayBuffer()))
            : await (async () => {
                const canvas = drawToCanvas(entry.image.bitmap, entry.image.width, entry.image.height);
                const png = await canvasToBlob(canvas, "image/png");
                return pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
              })();

        const page = pdf.addPage([geometryForPage.pageW, geometryForPage.pageH]);
        page.drawImage(embedded, {
          x: geometryForPage.x,
          y: geometryForPage.y,
          width: geometryForPage.drawW,
          height: geometryForPage.drawH,
        });
      }

      const output = await pdf.save();
      const bytes = new Uint8Array(output.length);
      bytes.set(output);
      setBlob(new Blob([bytes], { type: "application/pdf" }));
    } catch (cause) {
      setBuildError(cause instanceof Error ? cause.message : "The PDF could not be built.");
    } finally {
      setWorking(false);
    }
  }

  const totalBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
  const rasterised = entries.filter((entry) => entry.image.type !== "image/jpeg").length;
  const filename = entries[0] ? `${baseName(entries[0].file.name)}-images.pdf` : "images.pdf";
  const pageLabel =
    pageSize === "match"
      ? "Each page matches its image"
      : `${pageSize === "a4" ? "A4" : "Letter"}, ${orientation}`;

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label={entries.length === 0 ? "Drop images here" : "Add more images"}
        hint="JPEG and PNG embed directly; other formats are rasterised to PNG first."
        accept="image/*"
        multiple
        busy={busy}
        error={error}
        onFile={(files) => void add(files)}
      />

      {entries.length === 0 ? (
        <Note>
          Add images to build a document, one image per page. Nothing is uploaded — the pages are
          assembled by pdf-lib in this tab.
        </Note>
      ) : (
        <>
          <FileList
            label="Images, in page order"
            items={entries.map((entry) => ({
              id: entry.id,
              name: entry.file.name,
              meta: `${entry.image.width} × ${entry.image.height} px · ${formatBytes(entry.file.size)}`,
            }))}
            onMove={move}
            onRemove={remove}
            disabled={working}
          />

          <StatGrid className="sm:grid-cols-3">
            <Stat label="Images" value={entries.length} hint={`${entries.length === 1 ? "Page" : "Pages"} in the document`} />
            <Stat label="Total size in" value={formatBytes(totalBytes)} />
            <Stat
              label="Rasterised"
              value={rasterised}
              hint={rasterised === 0 ? "All embedded as-is" : "Converted to PNG, so size may change"}
            />
          </StatGrid>

          <PageSetupControls value={setup} onChange={applySetup} />

          {geometry ? (
            <PageSetupPreview
              entry={{ name: entries[0].file.name, url: entries[0].url, width: entries[0].image.width }}
              geometry={geometry}
              pageLabel={pageLabel}
            />
          ) : null}

          {fit === "fill" && pageSize !== "match" ? (
            <Note tone="warn">
              Filling the page scales each image until it covers the paper, so edges that spill outside
              are cropped. Switch to “fit inside” if nothing may be lost.
            </Note>
          ) : null}

          {buildError ? <Note tone="warn">{buildError}</Note> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void build()}
              disabled={working || entries.length === 0}
            >
              {working ? "Building…" : "Build PDF"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear} disabled={working}>
              Clear
            </button>
          </div>

          {blob ? (
            <>
              <ResultFooter label="New document">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob, filename)}>
                  Download PDF
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="File" value={filename} />
                <Stat label="Pages" value={entries.length} />
                <Stat label="Size" value={formatBytes(blob.size)} hint="Built in this tab" />
              </StatGrid>
            </>
          ) : null}

          <Note>
            Each page holds a picture of its image, not text, so nothing in the document can be
            selected or searched. JPEGs are embedded unchanged; other formats are re-encoded as PNG,
            which can change the file size. Nothing is uploaded.
          </Note>
        </>
      )}
    </div>
  );
}
