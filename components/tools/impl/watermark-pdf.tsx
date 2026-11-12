"use client";

import { useMemo, useState } from "react";

import { FileDrop, RangeInput, Segmented, TextInput } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import { PdfFacts, usePdfBuild, usePdfFile } from "@/components/tools/pdf-workbench";
import { downloadBlob } from "@/lib/download";
import { fileStem, parsePageRanges, watermarkPdf } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

const COLOURS: { label: string; value: string; rgb: { r: number; g: number; b: number } }[] = [
  { label: "Ink", value: "#1f2937", rgb: { r: 0.12, g: 0.16, b: 0.22 } },
  { label: "Grey", value: "#6b7280", rgb: { r: 0.42, g: 0.45, b: 0.5 } },
  { label: "Red", value: "#d93025", rgb: { r: 0.85, g: 0.19, b: 0.14 } },
  { label: "Blue", value: "#2563eb", rgb: { r: 0.15, g: 0.39, b: 0.92 } },
];

type Rotation = "0" | "45" | "90";

export default function WatermarkPdf() {
  const { pdf, error, busy, load, clear } = usePdfFile();
  const [text, setText] = useState("");
  const [size, setSize] = useState(60);
  const [opacity, setOpacity] = useState(15);
  const [rotation, setRotation] = useState<Rotation>("45");
  const [colour, setColour] = useState(COLOURS[0].value);
  const [pages, setPages] = useState("");

  // The built blob is only valid for the exact document *and* the exact options
  // it was built from. A memoised snapshot of those options changes identity
  // whenever any of them does, so one comparison invalidates the result no
  // matter which control moved — and a download can never hand back a document
  // that no longer matches what is on screen.
  const draft = useMemo(
    () => ({ text, size, opacity, rotation, colour, pages }),
    [text, size, opacity, rotation, colour, pages],
  );
  const source = useMemo(() => ({ pdf, draft }), [pdf, draft]);
  const { working, error: buildError, result: blob, run } = usePdfBuild(
    source,
    async (input) => {
      const { pdf: doc, draft: options } = input;
      if (!doc) throw new Error("Load a PDF first.");
      const swatch = COLOURS.find((entry) => entry.value === options.colour) ?? COLOURS[0];
      // `parsePageRanges` reports the pages it could read *and* an error for the
      // part that was out of range, so acting on the text alone would silently
      // stamp a truncated selection. The action is blocked on an error below.
      const range = options.pages.trim() ? parsePageRanges(options.pages, doc.pageCount) : null;
      const bytes = await watermarkPdf(doc.bytes, {
        text: options.text,
        size: options.size,
        opacity: options.opacity / 100,
        rotationDeg: Number(options.rotation),
        color: swatch.rgb,
        pages: range && range.pages.length > 0 ? range.pages : undefined,
      });
      const copy = new Uint8Array(bytes.length);
      copy.set(bytes);
      return new Blob([copy], { type: "application/pdf" });
    },
    "The watermark could not be added.",
  );

  const parsed = useMemo(
    () => (pdf && pages.trim() ? parsePageRanges(pages, pdf.pageCount) : null),
    [pdf, pages],
  );
  // Any error blocks the action.
  const rangeInvalid = Boolean(parsed && parsed.errors.length > 0);

  const swatch = COLOURS.find((entry) => entry.value === colour) ?? COLOURS[0];
  const first = pdf?.sizes[0];
  const fraction = typeof size === "number" ? size : 60;
  const previewScale = first ? Math.min(1, 260 / first.width) : 1;

  const filename = pdf ? `${fileStem(pdf.file.name)}-watermarked.pdf` : "watermarked.pdf";
  const markedPages = parsed && parsed.pages.length > 0 ? new Set(parsed.pages).size : (pdf?.pageCount ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label={pdf ? "Replace the PDF" : "Drop a PDF here"}
        hint="The mark is drawn onto the page in this tab; the document is never uploaded."
        accept="application/pdf,.pdf"
        busy={busy}
        error={error}
        selected={pdf ? { name: pdf.file.name, size: pdf.file.size } : null}
        onClear={clear}
        onFile={(files) => void load(files)}
      />

      {pdf ? (
        <>
          <PdfFacts name={pdf.file.name} size={pdf.file.size} pageCount={pdf.pageCount} />

          <TextInput
            label="Watermark text"
            value={text}
            onChange={setText}
            placeholder="e.g. CONFIDENTIAL"
            hint="Plain text, drawn in the font embedded in the app."
          />
          <div className="flex flex-wrap items-center gap-2">
            <TryExample onClick={() => setText("CONFIDENTIAL")}>Use “CONFIDENTIAL”</TryExample>
            <TryExample onClick={() => setText("DRAFT")}>Use “DRAFT”</TryExample>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <RangeInput
              label="Size (pt)"
              value={size}
              onChange={setSize}
              min={8}
              max={200}
              step={2}
              format={(value) => `${value} pt`}
            />
            <RangeInput
              label="Opacity"
              value={opacity}
              onChange={setOpacity}
              min={5}
              max={100}
              step={5}
              format={(value) => `${value}%`}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Segmented<Rotation>
              label="Rotation"
              value={rotation}
              onChange={setRotation}
              options={[
                { value: "0", label: "Flat" },
                { value: "45", label: "Diagonal" },
                { value: "90", label: "Vertical" },
              ]}
            />
            <div>
              <span className="label">Colour</span>
              <div role="group" aria-label="Watermark colour" className="flex flex-wrap gap-2">
                {COLOURS.map((entry) => {
                  const selected = entry.value === colour;
                  return (
                    <button
                      key={entry.value}
                      type="button"
                      aria-pressed={selected}
                      aria-label={entry.label}
                      onClick={() => setColour(entry.value)}
                      className={`size-11 rounded-md border-2 ${selected ? "border-fg" : "border-line"}`}
                      style={{ backgroundColor: entry.value }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <TextInput
            label="Pages to mark (optional)"
            value={pages}
            onChange={setPages}
            placeholder={`Empty marks every page (1-${pdf.pageCount})`}
            hint="Use 1-based numbers and hyphens, e.g. 1-3, 7."
            invalid={rangeInvalid}
          />
          {parsed && parsed.errors.length > 0 ? <Note tone="warn">{parsed.errors.join(" ")}</Note> : null}

          <div className="panel p-4">
            <p className="label mb-0">Position on the page</p>
            <div className="mt-3 flex justify-center">
              <div
                className="relative flex items-center justify-center overflow-hidden rounded-sm border border-line bg-white"
                style={{
                  width: first ? `${first.width * previewScale}px` : "180px",
                  height: first ? `${first.height * previewScale}px` : "240px",
                }}
              >
                {text ? (
                  <span
                    className="num select-none whitespace-nowrap font-bold"
                    style={{
                      color: swatch.value,
                      opacity: opacity / 100,
                      fontSize: `${Math.max(8, fraction * previewScale)}px`,
                      transform: `rotate(${-Number(rotation)}deg)`,
                    }}
                  >
                    {text}
                  </span>
                ) : (
                  <span className="px-4 text-center text-xs text-muted">Type the watermark to preview it.</span>
                )}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              {first ? `${first.width.toFixed(0)} × ${first.height.toFixed(0)} pt page` : "Page preview"}
            </p>
          </div>

          <Note>
            Watermarks people complain about are usually too opaque — 15% is a good starting point.
            The mark is drawn on top of the page, so it will cover content beneath it.
          </Note>

          {buildError ? <Note tone="warn">{buildError}</Note> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void run()}
              disabled={working || text.trim().length === 0 || rangeInvalid}
            >
              {working ? "Adding…" : "Add watermark"}
            </button>
            {rangeInvalid ? (
              <span className="text-sm text-muted">Fix the page range above first.</span>
            ) : text.trim().length === 0 ? (
              <span className="text-sm text-muted">Type the watermark text first.</span>
            ) : null}
          </div>

          {blob ? (
            <>
              <ResultFooter label="Watermarked document">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob, filename)}>
                  Download PDF
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="Pages marked" value={markedPages} />
                <Stat label="Pages in file" value={pdf.pageCount} />
                <Stat label="Size" value={formatBytes(blob.size)} hint="Assembled in this tab" />
              </StatGrid>
            </>
          ) : null}

          <Note tone="warn">
            A watermark is a visible marking, not a security control — anyone can remove it with the
            right tool. Use encryption and permissions if you need actual protection.
          </Note>
        </>
      ) : (
        <Note>Load a PDF to stamp it. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
