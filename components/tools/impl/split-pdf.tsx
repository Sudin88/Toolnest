"use client";

import JSZip from "jszip";
import { useMemo, useState } from "react";

import { FileDrop, NumberInput, Segmented, TextInput } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import { PdfFacts, usePdfBuild, usePdfFile } from "@/components/tools/pdf-workbench";
import { downloadBlob } from "@/lib/download";
import {
  chunkEvery,
  copyPagesToNewDocument,
  fileStem,
  parseGroupedRanges,
} from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

type Mode = "range" | "every" | "single";

/**
 * One produced file, named by the pages it holds.
 *
 * Every page is listed, not just the first and last: a group of `1,3,5` named
 * "1-5" would claim a contiguous run the file does not contain.
 */
function summarise(prefix: string, pages: number[]): string {
  const label = pages.length === 1 ? `page-${pages[0]}` : `pages-${pages.join("-")}`;
  return `${prefix}-${label}.pdf`;
}

export default function SplitPdf() {
  const { pdf, error, busy, load, clear } = usePdfFile();
  const [mode, setMode] = useState<Mode>("range");
  const [ranges, setRanges] = useState("");
  const [chunkSize, setChunkSize] = useState<number | "">(5);

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

  // Everything the split depends on, in one identity: any change drops a
  // previous result — and the produced-file list rides along with it, so the
  // two can never disagree.
  const source = useMemo(() => ({ pdf, plan, prefix }), [pdf, plan, prefix]);
  const { working, error: buildError, result, run } = usePdfBuild(
    source,
    async (input) => {
      const { pdf: doc, plan: groups, prefix: stem } = input;
      if (!doc || groups.groups.length === 0) throw new Error("Choose how to split first.");

      const built = await Promise.all(
        groups.groups.map(async (pages) => {
          const bytes = await copyPagesToNewDocument(doc.bytes, pages);
          // Copy into a plain ArrayBuffer-backed view so Blob and JSZip both take it.
          const copy = new Uint8Array(bytes.length);
          copy.set(bytes);
          return { name: summarise(stem, pages), bytes: copy };
        }),
      );

      if (built.length === 1) {
        const part = built[0];
        return {
          blob: new Blob([part.bytes], { type: "application/pdf" }),
          output: [{ name: part.name, size: part.bytes.byteLength }],
        };
      }

      const zip = new JSZip();
      for (const part of built) zip.file(part.name, part.bytes);
      const zipped = await zip.generateAsync({ type: "uint8array" });
      const bytesOut = new Uint8Array(zipped.length);
      bytesOut.set(zipped);
      const zipName = `${stem}.zip`;
      const zipBlob = new Blob([bytesOut], { type: "application/zip" });
      return {
        blob: zipBlob,
        output: [
          ...built.map((part) => ({ name: part.name, size: part.bytes.byteLength })),
          { name: zipName, size: zipBlob.size },
        ],
      };
    },
    "The document could not be split.",
  );

  const blob = result?.blob ?? null;
  const output = result?.output ?? [];

  const example = pdf
    ? pdf.pageCount >= 4
      ? `1-2; 3; 4-${pdf.pageCount}`
      : pdf.pageCount >= 2
        ? "1; 2"
        : "1"
    : "1; 2";

  const fileCount = plan.groups.length;
  const outputName = blob
    ? fileCount === 1
      ? summarise(prefix, plan.groups[0])
      : `${prefix}.zip`
    : "";

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
            onChange={(value) => setMode(value)}
            options={[
              { value: "range", label: "Page ranges" },
              { value: "every", label: "Every N pages" },
              { value: "single", label: "One file per page" },
            ]}
          />

          {mode === "range" ? (
            <>
              <TextInput
                label="Ranges: one file per line or per semicolon"
                value={ranges}
                onChange={(value) => setRanges(value)}
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
              onChange={(value) => setChunkSize(value)}
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
              onClick={() => void run()}
              disabled={working || fileCount === 0}
            >
              {working ? "Splitting…" : "Split PDF"}
            </button>
          </div>

          {blob ? (
            <>
              <ResultFooter label={fileCount === 1 ? "Split document" : "Split archive"}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob, outputName)}>
                  Download {fileCount === 1 ? "PDF" : "ZIP"}
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="Files" value={fileCount} />
                <Stat label="Pages in" value={pdf.pageCount} />
                <Stat label={fileCount === 1 ? "Size" : "Archive size"} value={formatBytes(blob.size)} hint="Built in this tab" />
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
            rather than as a dozen separate downloads. Pages are copied, not re-compressed: the
            content is byte-identical to the original. Nothing is uploaded.
          </Note>
        </>
      ) : (
        <Note>Load a PDF to choose a split mode. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
