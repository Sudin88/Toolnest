"use client";

import { useState } from "react";

import { FileDrop, FileList } from "@/components/tools/interactive";
import { ResultFooter, Note, Stat, StatGrid } from "@/components/tools/parts";
import { usePdfFiles } from "@/components/tools/pdf-workbench";
import { downloadBlob } from "@/lib/download";
import { fileStem, mergePdfs } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

/**
 * Combine documents in a chosen order. The order is the whole point — the first
 * file's pages come first — so it is set with the list controls and the running
 * page total is shown, which is the fastest way to catch a file added twice.
 */
export default function MergePdf() {
  const { entries, error, busy, add, move, remove, clear } = usePdfFiles();
  const [working, setWorking] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  // Any change to the list invalidates a previous result. Resetting during
  // render is React's documented pattern for deriving state from a changed input.
  const [blobFor, setBlobFor] = useState(entries);
  if (blobFor !== entries) {
    setBlobFor(entries);
    setBlob(null);
    setBuildError(null);
  }

  const totalPages = entries.reduce((sum, entry) => sum + entry.pageCount, 0);
  const totalBytes = entries.reduce((sum, entry) => sum + entry.size, 0);

  async function merge() {
    if (entries.length < 2) return;
    setWorking(true);
    setBuildError(null);
    setBlob(null);
    try {
      const bytes = await mergePdfs(entries.map((entry) => ({ name: entry.name, bytes: entry.bytes })));
      const copy = new Uint8Array(bytes.length);
      copy.set(bytes);
      setBlob(new Blob([copy], { type: "application/pdf" }));
    } catch (cause) {
      setBuildError(cause instanceof Error ? cause.message : "The files could not be merged.");
    } finally {
      setWorking(false);
    }
  }

  const filename = entries[0] ? `${fileStem(entries[0].name)}-merged.pdf` : "merged.pdf";

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label={entries.length === 0 ? "Drop PDFs here" : "Add more PDFs"}
        hint="Two or more files. The first file's pages come first; use the arrows to reorder."
        accept="application/pdf,.pdf"
        multiple
        busy={busy}
        error={error}
        onFile={(files) => void add(files)}
      />

      {entries.length === 0 ? (
        <Note>Add at least two PDFs to merge. Everything is assembled by pdf-lib in this tab.</Note>
      ) : (
        <>
          <FileList
            label="Documents to merge, in order"
            items={entries.map((entry) => ({
              id: entry.id,
              name: entry.name,
              meta: `${entry.pageCount} ${entry.pageCount === 1 ? "page" : "pages"} · ${formatBytes(entry.size)}`,
            }))}
            onMove={move}
            onRemove={remove}
            disabled={working}
          />

          <StatGrid className="sm:grid-cols-3">
            <Stat label="Documents" value={entries.length} />
            <Stat label="Pages, combined" value={totalPages} hint="Check this for a file added twice" />
            <Stat label="Total size in" value={formatBytes(totalBytes)} />
          </StatGrid>

          {entries.length === 1 ? (
            <Note tone="warn">Add a second document to merge — one file on its own is already a complete PDF.</Note>
          ) : null}

          {buildError ? <Note tone="warn">{buildError}</Note> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void merge()}
              disabled={working || entries.length < 2}
            >
              {working ? "Merging…" : "Merge PDFs"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear} disabled={working}>
              Clear
            </button>
          </div>

          {blob ? (
            <>
              <ResultFooter label="Merged document">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadBlob(blob, filename)}>
                  Download PDF
                </button>
              </ResultFooter>
              <StatGrid className="sm:grid-cols-3">
                <Stat label="File" value={filename} />
                <Stat label="Pages" value={totalPages} />
                <Stat label="Size" value={formatBytes(blob.size)} hint="Assembled in this tab" />
              </StatGrid>
            </>
          ) : null}

          <Note>
            Page content, annotations and links are preserved. Document-level features such as
            bookmarks and interactive form fields are not carried across, because the result is a new
            document. Nothing is uploaded.
          </Note>
        </>
      )}
    </div>
  );
}
