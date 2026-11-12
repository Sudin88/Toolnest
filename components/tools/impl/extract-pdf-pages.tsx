"use client";

import { useMemo, useState } from "react";

import { FileDrop, TextInput } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import { PdfFacts, usePdfBuild, usePdfFile } from "@/components/tools/pdf-workbench";
import { downloadBlob } from "@/lib/download";
import { copyPagesToNewDocument, fileStem, parsePageRanges } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

/**
 * One document in, one document out, containing only the pages asked for — in
 * the order asked for. Naming a page twice copies it, which is what makes this
 * different from Split: this is the tool for keeping a handful of pages out of a
 * long document, reordered.
 */
export default function ExtractPdfPages() {
  const { pdf, error, busy, load, clear } = usePdfFile();
  const [input, setInput] = useState("");

  const parsed = useMemo(
    () => (pdf ? parsePageRanges(input, pdf.pageCount) : { pages: [], errors: [] }),
    [pdf, input],
  );
  const source = useMemo(() => ({ pdf, parsed }), [pdf, parsed]);
  const { working, error: buildError, result: blob, run } = usePdfBuild(
    source,
    async (current) => {
      if (!current.pdf) throw new Error("Load a PDF first.");
      const bytes = await copyPagesToNewDocument(current.pdf.bytes, current.parsed.pages);
      const copy = new Uint8Array(bytes.length);
      copy.set(bytes);
      return new Blob([copy], { type: "application/pdf" });
    },
    "The pages could not be extracted.",
  );

  const example = pdf ? (pdf.pageCount >= 3 ? "3, 1, 1" : "1") : "1";

  const filename = pdf ? `${fileStem(pdf.file.name)}-extract.pdf` : "extract.pdf";
  const preview = parsed.pages.slice(0, 40);

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label={pdf ? "Replace the PDF" : "Drop a PDF here"}
        hint="The document is read in this tab and never uploaded."
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
            label="Pages to keep"
            value={input}
            onChange={setInput}
            placeholder={pdf.pageCount >= 3 ? "e.g. 3, 1, 1, 7-9" : "e.g. 1"}
            hint="Use 1-based numbers and hyphens for a run. Repeating a number copies that page."
            invalid={parsed.errors.length > 0}
          />

          <div className="flex flex-wrap items-center gap-2">
            <TryExample onClick={() => setInput(example)}>Use “{example}”</TryExample>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setInput(`1-${pdf.pageCount}`)}
            >
              Select every page
            </button>
          </div>

          {parsed.errors.length > 0 ? (
            <Note tone="warn">{parsed.errors.join(" ")}</Note>
          ) : null}

          {parsed.pages.length > 0 ? (
            <div className="panel p-4">
              <p className="label mb-0">
                Output preview · {parsed.pages.length} {parsed.pages.length === 1 ? "page" : "pages"}
              </p>
              <ol className="mt-3 flex flex-wrap gap-1.5">
                {preview.map((page, index) => (
                  <li
                    key={`${page}-${index}`}
                    className="num rounded border border-line bg-surface-2 px-2 py-1 text-xs font-semibold text-fg"
                  >
                    {page}
                  </li>
                ))}
                {parsed.pages.length > preview.length ? (
                  <li className="px-2 py-1 text-xs text-muted">
                    +{parsed.pages.length - preview.length} more
                  </li>
                ) : null}
              </ol>
              <p className="mt-3 text-xs text-muted">
                Pages appear in exactly this order, and a repeated number duplicates that page.
              </p>
            </div>
          ) : (
            <Note>Enter the pages to keep, for example “{example}”, to see the output order.</Note>
          )}

          {buildError ? <Note tone="warn">{buildError}</Note> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void run()}
              disabled={working || parsed.pages.length === 0 || parsed.errors.length > 0}
            >
              {working ? "Extracting…" : "Extract pages"}
            </button>
            {parsed.errors.length > 0 && parsed.pages.length > 0 ? (
              <span className="text-sm text-muted">Fix the page range above to continue.</span>
            ) : null}
          </div>

          {blob ? (
            <>
              <ResultFooter label="Extracted document">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob, filename)}>
                  Download PDF
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="Pages out" value={parsed.pages.length} />
                <Stat label="Pages in" value={pdf.pageCount} />
                <Stat label="Size" value={formatBytes(blob.size)} hint="Only the pages you asked for" />
              </StatGrid>
            </>
          ) : null}

          <Note>
            Pages are copied between documents rather than re-rendered, so the content is identical
            to the original. Annotations and links come across; interactive form fields belong to the
            document and do not.
          </Note>
        </>
      ) : (
        <Note>Load a PDF to choose which pages to keep. Nothing is uploaded.</Note>
      )}
    </div>
  );
}
