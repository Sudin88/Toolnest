"use client";

import { useCallback, useRef, useState } from "react";

import { FileDrop } from "@/components/tools/interactive";
import { Note, Stat, StatGrid, SubHeading } from "@/components/tools/parts";
import { summarisePdf, validatePdfFile, type PdfSummary } from "@/lib/pdf";
import { formatBytes } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  size: number;
  summary: PdfSummary;
}

const ORIENTATION_LABEL: Record<string, string> = {
  portrait: "Portrait",
  landscape: "Landscape",
  square: "Square",
  mixed: "Mixed",
};

/**
 * Reads a document and reports what is in it, without opening a reader. The
 * table keeps every file loaded in the session so two documents can be compared
 * side by side — which is the actual reason people ask "how many pages?".
 */
export default function PdfPageCounter() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);

  const onFile = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const problem = validatePdfFile(file);
      if (problem) throw new Error(problem);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const summary = await summarisePdf(bytes);
      counter.current += 1;
      setRows((prev) => [
        ...prev,
        { id: `pdf-${counter.current}`, name: file.name, size: file.size, summary },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The PDF could not be read.");
    } finally {
      setBusy(false);
    }
  }, []);

  const latest = rows.at(-1);
  const totalPages = rows.reduce((sum, row) => sum + row.summary.pageCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <FileDrop
        label="Drop a PDF here"
        hint="The file is read in memory and never uploaded or modified."
        accept="application/pdf,.pdf"
        busy={busy}
        error={error}
        onFile={(files) => void onFile(files)}
      />

      {rows.length === 0 ? (
        <Note>
          Drop in a PDF. The page count appears without any further action, along with page sizes,
          the orientation mix and any metadata recorded in the file.
        </Note>
      ) : (
        <>
          {rows.length > 1 ? (
            <StatGrid className="sm:grid-cols-3">
              <Stat label="Files" value={rows.length} />
              <Stat label="Pages, all files" value={totalPages} />
              <Stat label="Largest file" value={formatBytes(Math.max(...rows.map((row) => row.size)))} />
            </StatGrid>
          ) : null}

          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Page counts and facts for each loaded PDF</caption>
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted">File</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted">Pages</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted">Size</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-muted">Orientation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-b-0">
                      <td className="max-w-0 px-4 py-2.5">
                        <span className="block truncate text-fg" title={row.name}>
                          {row.name}
                        </span>
                      </td>
                      <td className="num px-4 py-2.5 font-semibold text-fg">{row.summary.pageCount}</td>
                      <td className="num px-4 py-2.5 text-fg">{formatBytes(row.size)}</td>
                      <td className="px-4 py-2.5 text-fg">
                        {ORIENTATION_LABEL[row.summary.orientation] ?? row.summary.orientation}
                        {row.summary.mixedSizes ? (
                          <span className="block text-xs text-muted">Mixed page sizes</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {latest ? (
            <div className="flex flex-col gap-3">
              <SubHeading>Facts for “{latest.name}”</SubHeading>
              <StatGrid className="sm:grid-cols-3">
                <Stat
                  label="Page size"
                  value={`${latest.summary.sizes[0]?.width.toFixed(0) ?? "-"} × ${latest.summary.sizes[0]?.height.toFixed(0) ?? "-"} pt`}
                  hint={latest.summary.mixedSizes ? "Pages differ in size" : "All pages match"}
                />
                <Stat label="Orientation" value={ORIENTATION_LABEL[latest.summary.orientation] ?? "-"} />
                <Stat
                  label="Created"
                  value={latest.summary.creationDate ? latest.summary.creationDate.toISOString().slice(0, 10) : "-"}
                  hint={latest.summary.creationDate ? undefined : "Not recorded in the file"}
                />
              </StatGrid>

              {latest.summary.title ||
              latest.summary.author ||
              latest.summary.producer ||
              latest.summary.creator ? (
                <dl className="panel-inset grid gap-x-4 gap-y-2 px-4 py-3.5 text-sm sm:grid-cols-2">
                  {[
                    ["Title", latest.summary.title],
                    ["Author", latest.summary.author],
                    ["Producer", latest.summary.producer],
                    ["Creator", latest.summary.creator],
                  ]
                    .filter(([, value]) => Boolean(value))
                    .map(([term, value]) => (
                      <div key={term as string} className="min-w-0">
                        <dt className="text-xs text-muted">{term}</dt>
                        <dd className="truncate text-fg" title={value as string}>
                          {value}
                        </dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <Note>This file records no title, author or producer metadata.</Note>
              )}
            </div>
          ) : null}

          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRows([])}>
              Clear the list
            </button>
          </div>
        </>
      )}
    </div>
  );
}
