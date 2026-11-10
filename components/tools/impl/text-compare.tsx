"use client";

import { useMemo, useState } from "react";

import { Check, TextArea } from "@/components/tools/interactive";
import { Empty, Stat, StatGrid } from "@/components/tools/parts";
import { diffText, type LineDiff } from "@/lib/diff";
import { cn, formatNumber } from "@/lib/utils";

export default function TextCompare() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [wordLevel, setWordLevel] = useState(true);

  const diff = useMemo(
    () => diffText(left, right, { ignoreCase, wordLevel }),
    [left, right, ignoreCase, wordLevel],
  );

  const hasInput = left.length > 0 || right.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea
          label="Original"
          value={left}
          onChange={setLeft}
          rows={10}
          mono
          placeholder="Paste the first version here…"
        />
        <TextArea
          label="Revised"
          value={right}
          onChange={setRight}
          rows={10}
          mono
          placeholder="Paste the second version here…"
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Check checked={wordLevel} onChange={setWordLevel} label="Highlight at word level too" />
        <Check checked={ignoreCase} onChange={setIgnoreCase} label="Ignore letter case" />
      </div>

      <StatGrid className="lg:grid-cols-3">
        <Stat label="Added lines" value={formatNumber(diff.added)} />
        <Stat label="Removed lines" value={formatNumber(diff.removed)} />
        <Stat label="Unchanged lines" value={formatNumber(diff.unchanged)} />
      </StatGrid>

      <div>
        <h3 className="mb-2 font-display text-[0.9375rem] font-bold text-fg">Differences</h3>
        {!hasInput ? (
          <Empty>Paste two versions of the same text to see what changed.</Empty>
        ) : diff.added === 0 && diff.removed === 0 ? (
          <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
            The two blocks are identical{ignoreCase ? " ignoring letter case" : ""}.
          </p>
        ) : (
          <div className="scroll-region max-h-[36rem] overflow-auto rounded-md border border-line bg-surface-2 font-mono text-[0.8125rem] leading-relaxed">
            {diff.lines.map((line, index) => (
              <DiffRow key={index} line={line} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiffRow({ line }: { line: LineDiff }) {
  const marker = line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " ";

  return (
    <div
      className={cn(
        "flex items-start",
        line.kind === "added" && "bg-accent/10",
        line.kind === "removed" && "bg-highlight/12",
      )}
    >
      <span className="w-11 shrink-0 select-none border-r border-line px-2 py-0.5 text-right text-muted tabular-nums">
        {line.leftNumber ?? ""}
      </span>
      <span className="w-11 shrink-0 select-none border-r border-line px-2 py-0.5 text-right text-muted tabular-nums">
        {line.rightNumber ?? ""}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "w-6 shrink-0 select-none px-2 py-0.5 font-semibold",
          line.kind === "added" ? "text-accent-text" : line.kind === "removed" ? "text-highlight-text" : "text-transparent",
        )}
      >
        {marker}
      </span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words py-0.5 pr-3 text-fg">
        {line.text.length === 0 ? "\u00a0" : null}
        {line.words ? (
          <WordParts line={line} />
        ) : (
          line.text
        )}
      </span>
    </div>
  );
}

function WordParts({ line }: { line: LineDiff }) {
  const parts = line.words ?? [];
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "same") return <span key={index}>{part.text}</span>;
        if (line.kind === "removed" && part.kind === "removed") {
          return (
            <del key={index} className="rounded-sm bg-highlight/25 text-highlight-strong decoration-highlight-strong/70">
              {part.text}
            </del>
          );
        }
        if (line.kind === "added" && part.kind === "added") {
          return (
            <ins key={index} className="rounded-sm bg-accent/20 text-fg no-underline">
              {part.text}
            </ins>
          );
        }
        return null;
      })}
    </>
  );
}
