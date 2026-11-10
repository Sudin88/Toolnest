"use client";

import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ImagePreview } from "@/components/tools/image-workbench";
import { FileDrop, FileList, NumberInput, Select } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid, SubHeading } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { baseName, canvasToBlob, drawToCanvas, loadImageFile, type LoadedImage } from "@/lib/image";
import {
  MAX_IMAGES_TO_PDF,
  imagePageGeometry,
  type ImageFit,
  type ImageOrientation,
  type ImagePageSize,
} from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

interface ImageEntry {
  id: string;
  file: File;
  image: LoadedImage;
  url: string;
}

/**
 * Many images into one document, one image per page.
 *
 * This is the multi-file sibling of Image to PDF: that tool tunes a single page,
 * this one repeats a page setup down a list. JPEG and PNG are embedded as they
 * are, so nothing is re-encoded; anything else the browser can decode is
 * rasterised to PNG first, which is why the note about quality is honest rather
 * than blanket.
 */
export default function ImagesToPdf() {
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pageSize, setPageSize] = useState<ImagePageSize>("a4");
  const [orientation, setOrientation] = useState<ImageOrientation>("portrait");
  const [fit, setFit] = useState<ImageFit>("contain");
  const [margin, setMargin] = useState<number | "">(10);
  const [working, setWorking] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const counter = useRef(0);
  const entriesRef = useRef(entries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Every object URL belongs to this tool, so it is revoked here — including on
  // unmount, so navigating away from the page does not leak a blob per image.
  useEffect(
    () => () => {
      for (const entry of entriesRef.current) URL.revokeObjectURL(entry.url);
    },
    [],
  );

  const reset = useCallback(() => {
    setBlob(null);
    setBuildError(null);
  }, []);

  const add = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setBusy(true);
      setError(null);

      const added: ImageEntry[] = [];
      const problems: string[] = [];
      for (const file of files) {
        try {
          const image = await loadImageFile(file);
          counter.current += 1;
          added.push({ id: `img-${counter.current}`, file, image, url: URL.createObjectURL(file) });
        } catch (cause) {
          problems.push(cause instanceof Error ? cause.message : `“${file.name}” could not be opened.`);
        }
      }

      const room = Math.max(0, MAX_IMAGES_TO_PDF - entriesRef.current.length);
      if (added.length > room) {
        problems.push(
          `Only ${MAX_IMAGES_TO_PDF} images are handled at once, so ${added.length - room} were not added.`,
        );
      }

      const accepted = added.slice(0, room);
      for (const entry of added.slice(room)) URL.revokeObjectURL(entry.url);
      if (accepted.length > 0) setEntries((prev) => prev.concat(accepted));
      if (problems.length > 0) setError(problems.join(" "));
      setBusy(false);
      reset();
    },
    [reset],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      setEntries((prev) => {
        const index = prev.findIndex((entry) => entry.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= prev.length) return prev;
        const next = prev.slice();
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
      reset();
    },
    [reset],
  );

  const remove = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const entry = prev.find((item) => item.id === id);
        if (entry) URL.revokeObjectURL(entry.url);
        return prev.filter((item) => item.id !== id);
      });
      reset();
    },
    [reset],
  );

  const clear = useCallback(() => {
    for (const entry of entriesRef.current) URL.revokeObjectURL(entry.url);
    setEntries([]);
    setError(null);
    reset();
  }, [reset]);

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

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Page size"
              value={pageSize}
              onChange={(value) => {
                setPageSize(value as ImagePageSize);
                reset();
              }}
              options={[
                { value: "a4", label: "A4 (210 × 297 mm)" },
                { value: "letter", label: "Letter (8.5 × 11 in)" },
                { value: "match", label: "Match each image exactly" },
              ]}
            />
            <Select
              label="Orientation"
              value={orientation}
              onChange={(value) => {
                setOrientation(value as ImageOrientation);
                reset();
              }}
              options={[
                { value: "portrait", label: "Portrait" },
                { value: "landscape", label: "Landscape" },
                { value: "auto", label: "Auto from each image" },
              ]}
              disabled={pageSize === "match"}
              hint={pageSize === "match" ? "The page follows the image." : undefined}
            />
            <Select
              label="Fit"
              value={fit}
              onChange={(value) => {
                setFit(value as ImageFit);
                reset();
              }}
              options={[
                { value: "contain", label: "Fit inside the page (no cropping)" },
                { value: "fill", label: "Fill the page (may crop edges)" },
              ]}
              disabled={pageSize === "match"}
            />
            <NumberInput
              label="Margin (mm)"
              value={margin}
              onChange={(value) => {
                setMargin(value);
                reset();
              }}
              min={0}
              max={60}
              hint={pageSize === "match" ? "Ignored when the page matches the image." : "Applied to every edge."}
            />
          </div>

          {geometry ? (
            <div className="panel p-4">
              <SubHeading>Page setup, using “{entries[0].file.name}”</SubHeading>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className="relative mx-auto w-full max-w-[13rem] shrink-0 overflow-hidden rounded-sm border border-line bg-white sm:mx-0"
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
                    <ImagePreview
                      src={entries[0].url}
                      alt="Where the first image sits on its page"
                      className="size-full object-cover"
                    />
                  </div>
                  {geometry.cropped ? (
                    <span className="absolute inset-0 border border-dashed border-highlight/60" aria-hidden="true" />
                  ) : null}
                </div>
                <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Page</dt>
                    <dd className="num text-fg">
                      {geometry.pageW.toFixed(1)} × {geometry.pageH.toFixed(1)} pt
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Image on page</dt>
                    <dd className="num text-fg">
                      {geometry.drawW.toFixed(1)} × {geometry.drawH.toFixed(1)} pt
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted">Result</dt>
                    <dd className="text-fg">
                      {pageLabel}
                      {geometry.cropped ? " · edges cropped" : ""}
                    </dd>
                  </div>
                </dl>
              </div>
              <Note tone="info">
                At 300 pixels per inch — the usual target for print — this image covers about{" "}
                {(entries[0].image.width / 300).toFixed(1)} in across. It will still display correctly on
                screen at any size.
              </Note>
            </div>
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
