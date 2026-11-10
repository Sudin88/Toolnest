"use client";

import JSZip from "jszip";
import { useMemo, useState } from "react";

import { FileDrop, NumberInput, Segmented, TextInput } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import { PdfFacts, usePdfFile } from "@/components/tools/pdf-workbench";
import { downloadBlob } from "@/lib/download";
import {
  chunkEvery,
  copyPagesToNewDocument,
  fileStem,
  parseGroupedRanges,
} from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

type Mode = "range" | "every" | "single";

/** One produced file, named by the pages it holds. */
function summarise(prefix: string, pages: number[]): string {
  const label = pages.length === 1 ? `page-${pages[0]}` : `pages-${pages[0]}-${pages[pages.length - 1]}`;
  return `${prefix}-${label}.pdf`;
}

export default function SplitPdf() {
  const { pdf, error, busy, load, clear } = usePdfFile();
  const [mode, setMode] = useState<Mode>("range");
  const [ranges, setRanges] = useState("");
  const [chunkSize, setChunkSize] = useState<number | "">(5);
  const [working, setWorking] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [blob, setBlob] = useState<{ blob: Blob; name: string } | null>(null);
  const [output, setOutput] = useState<{ name: string; size: number }[]>([]);

  const [signature, setSignature] = useState<unknown>(pdf);
  if (signature !== pdf) {
    setSignature(pdf);
    setBlob(null);
    setOutput([]);
    setBuildError(null);
  }

  const prefix = pdf ? `${fileStem(pdf.file.name)}-split` : "split";

  const plan = useMemo(() => {
    if (!pdf) return { groups: [] as number[][], errors: [] as string[] };
    if (mode === "single") return { groups: chunkEvery(pdf.pageCount, 1), errors: [] };
    if (mode === "every") {
      const size = typeof chunkSize === "number" ? chunkSize : 0;
      if (size < 1) return { groups: [], errors: ["Pages per file must be 1 or more."] };
      return { groups: chunkEvery(pdf.pageCount, size), errors: [] };
    }
    return parseGroupedRanges(ranges, pdf.pageCount);
  }, [pdf, mode, ranges, chunkSize]);

  const example = pdf
    ? pdf.pageCount >= 4
      ? `1-2; 3; 4-${pdf.pageCount}`
      : pdf.pageCount >= 2
        ? "1; 2"
        : "1"
    : "1; 2";

  async function split() {
    if (!pdf || plan.groups.length === 0) return;
    setWorking(true);
    setBuildError(null);
    setBlob(null);
    setOutput([]);
    try {
      const built = await Promise.all(
        plan.groups.map(async (pages) => {
          const bytes = await copyPagesToNewDocument(pdf.bytes, pages);
          // Copy into a plain ArrayBuffer-backed view so Blob and JSZip both take it.
          const copy = new Uint8Array(bytes.length);
          copy.set(bytes);
          return { name: summarise(prefix, pages), bytes: copy };
        }),
      );

      if (built.length === 1) {
        const part = built[0];
        setBlob({ blob: new Blob([part.bytes], { type: "application/pdf" }), name: part.name });
        setOutput([{ name: part.name, size: part.bytes.byteLength }]);
      } else {
        const zip = new JSZip();
        for (const part of built) zip.file(part.name, part.bytes);
        const zipped = await zip.generateAsync({ type: "uint8array" });
        const bytesOut = new Uint8Array(zipped.length);
        bytesOut.set(zipped);
        const zipName = `${prefix}.zip`;
        const zipBlob = new Blob([bytesOut], { type: "application/zip" });
        setBlob({ blob: zipBlob, name: zipName });
        setOutput([
          ...built.map((part) => ({ name: part.name, size: part.bytes.byteLength })),
          { name: zipName, size: zipBlob.size },
        ]);
      }
    } catch (cause) {
      setBuildError(cause instanceof Error ? cause.message : "The document could not be split.");
    } finally {
      setWorking(false);
    }
  }

  const fileCount = plan.groups.length;

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label={pdf ? "Replace the PDF" : "Drop a PDF here"}
        hint="Pages are copied between documents, never re-rendered, so quality is untouched."
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
            label="Split by"
            value={mode}
            onChange={(value) => {
              setMode(value);
              setBlob(null);
              setOutput([]);
            }}
            options={[
              { value: "range", label: "Page ranges" },
              { value: "every", label: "Every N pages" },
              { value: "single", label: "One file per page" },
            ]}
          />

          {mode === "range" ? (
            <>
              <TextInput
                label="Ranges — one file per line or per semicolon"
                value={ranges}
                onChange={(value) => {
                  setRanges(value);
                  setBlob(null);
                  setOutput([]);
                }}
                placeholder="e.g. 1-3; 4; 5-8"
                hint="Use 1-based numbers and hyphens. Each group becomes one file."
                invalid={plan.errors.length > 0}
              />
              <div className="flex flex-wrap items-center gap-2">
                <TryExample onClick={() => setRanges(example)}>Use “{example}”</TryExample>
              </div>
            </>
          ) : mode === "every" ? (
            <NumberInput
              label="Pages per file"
              value={chunkSize}
              onChange={(value) => {
                setChunkSize(value);
                setBlob(null);
                setOutput([]);
              }}
              min={1}
              max={pdf.pageCount}
            />
          ) : null}

          {plan.errors.length > 0 ? <Note tone="warn">{plan.errors.join(" ")}</Note> : null}

          {fileCount > 0 ? (
            <div className="panel p-4">
              <p className="label mb-0">
                Output preview · {fileCount} {fileCount === 1 ? "file" : "files"}
              </p>
              <ol className="scroll-region mt-3 flex max-h-64 flex-col gap-1.5 overflow-auto pr-1">
                {plan.groups.slice(0, 60).map((pages, index) => (
                  <li key={index} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-fg" title={pages.join(", ")}>
                      {summarise(prefix, pages)}
                    </span>
                    <span className="num shrink-0 text-xs text-muted">
                      {pages.length === 1 ? "1 page" : `${pages.length} pages`}
                    </span>
                  </li>
                ))}
                {fileCount > 60 ? (
                  <li className="text-xs text-muted">+{fileCount - 60} more files</li>
                ) : null}
              </ol>
            </div>
          ) : (
            <Note>Choose how to split, for example “{example}”, to see how many files you will get.</Note>
          )}

          {buildError ? <Note tone="warn">{buildError}</Note> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void split()}
              disabled={working || fileCount === 0}
            >
              {working ? "Splitting…" : "Split PDF"}
            </button>
          </div>

          {blob ? (
            <>
              <ResultFooter label={fileCount === 1 ? "Split document" : "Split archive"}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob.blob, blob.name)}>
                  Download {fileCount === 1 ? "PDF" : "ZIP"}
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="Files" value={fileCount} />
                <Stat label="Pages in" value={pdf.pageCount} />
                <Stat label={fileCount === 1 ? "Size" : "Archive size"} value={formatBytes(blob.blob.size)} hint="Built in this tab" />
              </StatGrid>

              {fileCount > 1 ? (
                <ul className="panel-inset max-h-64 overflow-auto px-4 py-3 text-sm">
                  {output.map((item) => (
                    <li key={item.name} className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
                      <span className="truncate text-fg">{item.name}</span>
                      <span className="num shrink-0 text-xs text-muted">{formatBytes(item.size)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          <Note>
            Splitting usually produces several documents, so they are returned together as a zip
            rather than as a dozen separate downloads. Pages are copied, not re-compressed — the
            content is byte-identical to the original. Nothing is uploaded.
          </Note>
        </>
      ) : (
        <Note>Load a PDF to choose a split mode. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
