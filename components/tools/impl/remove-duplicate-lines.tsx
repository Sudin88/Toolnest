"use client";

import { useMemo, useState } from "react";

import { Check, CopyButton, TextArea } from "@/components/tools/interactive";
import { Empty, OutputBox, Stat, StatGrid } from "@/components/tools/parts";
import { dedupeLines } from "@/lib/text";
import { formatNumber } from "@/lib/utils";

export default function RemoveDuplicateLines() {
  const [text, setText] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sort, setSort] = useState(false);

  const result = useMemo(
    () => dedupeLines(text, { ignoreCase, trim, removeEmpty, sort }),
    [text, ignoreCase, trim, removeEmpty, sort],
  );

  const hasInput = text.length > 0;
  const removedCount = Math.max(0, result.total - result.kept);

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

      <StatGrid className="lg:grid-cols-3">
        <Stat label="Lines in" value={formatNumber(result.total)} />
        <Stat label="Lines out" value={formatNumber(result.kept)} />
        <Stat label="Duplicates removed" value={formatNumber(removedCount)} />
      </StatGrid>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="label mb-0">Cleaned list</span>
          <CopyButton value={result.output} disabled={!hasInput} />
        </div>
        {hasInput ? <OutputBox>{result.output}</OutputBox> : <Empty>Paste a list to clean it up.</Empty>}
      </div>
    </div>
  );
}
