"use client";

import { useMemo, useState } from "react";

import { FileDrop, Segmented } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid } from "@/components/tools/parts";
import { PdfFacts, usePdfBuild, usePdfFile } from "@/components/tools/pdf-workbench";
import { downloadBlob } from "@/lib/download";
import { fileStem, normaliseAngle, rotatePdf } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

type Mode = "all" | "per";

/**
 * Turn pages upright. Rotation is stored as a display transform, so the page box
 * keeps its size and nothing is re-rendered — which is why this is the right fix
 * for a scanner that fed one sheet sideways, and why it is safe on any document.
 */
export default function RotatePdf() {
  const { pdf, error, busy, load, clear } = usePdfFile();
  const [mode, setMode] = useState<Mode>("all");
  const [allDelta, setAllDelta] = useState(90);
  const [per, setPer] = useState<number[]>([]);

  // A new document resets the per-page turns; a previous result is dropped by
  // the build hook, because `pdf` is part of its input.
  const [signature, setSignature] = useState<unknown>(pdf);
  if (signature !== pdf) {
    setSignature(pdf);
    setPer(pdf ? pdf.rotations.map(() => 0) : []);
  }

  const deltas = useMemo(
    () => (mode === "all" ? (pdf ? pdf.rotations.map(() => allDelta) : []) : per),
    [mode, pdf, allDelta, per],
  );
  const source = useMemo(() => ({ pdf, deltas }), [pdf, deltas]);
  const { working, error: buildError, result: blob, run } = usePdfBuild(
    source,
    async (input) => {
      if (!input.pdf) throw new Error("Load a PDF first.");
      const bytes = await rotatePdf(input.pdf.bytes, input.deltas);
      const copy = new Uint8Array(bytes.length);
      copy.set(bytes);
      return new Blob([copy], { type: "application/pdf" });
    },
    "The document could not be rotated.",
  );

  const net = pdf ? pdf.rotations.map((base, index) => normaliseAngle(base + (deltas[index] ?? 0))) : [];
  const changed = pdf ? net.some((angle, index) => angle !== normaliseAngle(pdf.rotations[index])) : false;

  function bump(index: number) {
    setPer((prev) => prev.map((value, at) => (at === index ? normaliseAngle(value + 90) : value)));
  }

  function resetPage(index: number) {
    setPer((prev) => prev.map((value, at) => (at === index ? 0 : value)));
  }

  const filename = pdf ? `${fileStem(pdf.file.name)}-rotated.pdf` : "rotated.pdf";
  const turnedPages = net.filter((angle, index) => angle !== normaliseAngle(pdf?.rotations[index] ?? 0)).length;

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label={pdf ? "Replace the PDF" : "Drop a PDF here"}
        hint="Turn pages without changing their size. Nothing is uploaded."
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

          <Segmented<Mode>
            label="Which pages"
            value={mode}
            onChange={(value) => setMode(value)}
            options={[
              { value: "all", label: "Every page" },
              { value: "per", label: "Per page" },
            ]}
          />

          {mode === "all" ? (
            <Segmented
              label="Turn"
              value={String(allDelta)}
              onChange={(value) => setAllDelta(Number(value))}
              options={[
                { value: "90", label: "90° right" },
                { value: "180", label: "180°" },
                { value: "270", label: "90° left" },
              ]}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="label mb-0">Set each page</p>
              <ol className="scroll-region flex max-h-80 flex-col gap-1.5 overflow-auto pr-1">
                {pdf.rotations.map((base, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 rounded-md border border-line bg-surface-2 py-1.5 pl-3.5 pr-1.5"
                  >
                    <span className="num w-16 shrink-0 text-sm font-semibold text-fg">Page {index + 1}</span>
                    <span className="num min-w-0 flex-1 text-xs text-muted">
                      {normaliseAngle(base)}° → {net[index]}°
                      {net[index] === normaliseAngle(base) ? " (unchanged)" : ""}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => bump(index)}
                      aria-label={`Rotate page ${index + 1} 90 degrees right`}
                    >
                      Rotate 90° right
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => resetPage(index)}
                      disabled={per[index] === 0}
                      aria-label={`Reset page ${index + 1}`}
                    >
                      Reset
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {buildError ? <Note tone="warn">{buildError}</Note> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={working || !changed}>
              {working ? "Rotating…" : "Rotate pages"}
            </button>
            {!changed ? <span className="text-sm text-muted">No page is turned yet.</span> : null}
          </div>

          {blob ? (
            <>
              <ResultFooter label="Rotated document">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob, filename)}>
                  Download PDF
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="Pages turned" value={turnedPages} />
                <Stat label="Pages in file" value={pdf.pageCount} />
                <Stat label="Size" value={formatBytes(blob.size)} hint="Unchanged page content" />
              </StatGrid>
            </>
          ) : null}

          <Note>
            Rotation is applied to the page&rsquo;s display transform, so the content turns while the page
            box keeps its dimensions and a mixed-orientation document stays mixed. A few readers cache
            rendering aggressively — reopen the file if a change does not show at once.
          </Note>
        </>
      ) : (
        <Note>Load a PDF to turn its pages. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
