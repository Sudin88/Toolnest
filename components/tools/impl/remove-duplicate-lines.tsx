"use client";

import { useMemo, useState } from "react";

import { Check, CopyButton, TextArea } from "@/components/tools/interactive";
import { Empty, LimitNote, OutputBox, ResultFooter, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import { MAX_TEXT_LENGTH, dedupeLines, type DedupeResult } from "@/lib/text";
import { useToolInput } from "@/lib/tool-input";
import { formatNumber } from "@/lib/utils";

const SAMPLE = `apple
banana
apple
Cherry

banana
apple`;

/** The neutral result shown while a paste is past the cap. */
const NOTHING: DedupeResult = { output: "", kept: 0, duplicates: 0, blanks: 0, total: 0 };

export default function RemoveDuplicateLines() {
  const [text, setText] = useToolInput<string>("remove-duplicate-lines", "text", "", {
    handover: true,
  });
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sort, setSort] = useState(false);

  // Past the cap the sort and de-duplication pass is skipped: sorting a
  // multi-megabyte list with `localeCompare` is what freezes the tab.
  const tooLong = text.length > MAX_TEXT_LENGTH;
  const result = useMemo(
    () => (tooLong ? NOTHING : dedupeLines(text, { ignoreCase, trim, removeEmpty, sort })),
    [text, ignoreCase, trim, removeEmpty, sort, tooLong],
  );

  const hasInput = text.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Your list — one item per line"
        value={text}
        onChange={setText}
        rows={10}
        placeholder={"apple\nbanana\napple\nCherry\n\nbanana"}
      />

      <fieldset className="grid gap-3.5 sm:grid-cols-2">
        <legend className="label">Matching options</legend>
        <Check checked={ignoreCase} onChange={setIgnoreCase} label="Ignore case when matching" />
        <Check checked={trim} onChange={setTrim} label="Trim surrounding whitespace" />
        <Check checked={removeEmpty} onChange={setRemoveEmpty} label="Remove blank lines" />
        <Check checked={sort} onChange={setSort} label="Sort the result alphabetically" />
      </fieldset>

      {!hasInput ? (
        <div className="flex flex-wrap gap-2">
          <TryExample onClick={() => setText(SAMPLE)} />
        </div>
      ) : null}

      {tooLong ? (
        <LimitNote length={text.length} limit={MAX_TEXT_LENGTH} />
      ) : (
        <>
          <StatGrid className="lg:grid-cols-3">
            <Stat label="Lines in" value={formatNumber(result.total)} />
            <Stat label="Lines out" value={formatNumber(result.kept)} />
            <Stat label="Duplicates removed" value={formatNumber(result.duplicates)} hint={result.blanks > 0 ? `${formatNumber(result.blanks)} blank ${result.blanks === 1 ? "line" : "lines"} also dropped` : undefined} />
          </StatGrid>

          <div>
            <ResultFooter label="Cleaned list">
              <CopyButton value={result.output} disabled={!hasInput} />
            </ResultFooter>
            {hasInput ? <OutputBox>{result.output}</OutputBox> : <Empty>Paste a list to clean it up.</Empty>}
          </div>
        </>
      )}
    </div>
  );
}
