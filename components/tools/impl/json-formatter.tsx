"use client";

import { useMemo, useState } from "react";

import { Check, CopyButton, Segmented, Select, TextArea } from "@/components/tools/interactive";
import { Empty, LimitNote, Note, OutputBox, ResultFooter, Stat, StatGrid } from "@/components/tools/parts";
import { downloadText } from "@/lib/download";
import { countKeys, minifyJson, parseJson, stringifyJson } from "@/lib/json-tool";
import { MAX_TEXT_LENGTH } from "@/lib/text";
import { useToolInput } from "@/lib/tool-input";
import { formatBytes, formatNumber } from "@/lib/utils";

const SAMPLE = `{
  "name": "ToolNest",
  "categories": ["image", "text", "calculators"],
  "free": true,
  "creator": { "private": false, "note": "no account needed" }
}`;

type Layout = "pretty" | "minified";

export default function JsonFormatter() {
  const [input, setInput] = useToolInput<string>("json-formatter", "input", "", { handover: true });
  const [layout, setLayout] = useState<Layout>("pretty");
  const [indent, setIndent] = useState("2");
  const [sortKeys, setSortKeys] = useState(false);

  // Past the cap the parse, the key walk and the re-serialise are all skipped —
  // run on every keystroke over a multi-megabyte paste, that is what stalls the
  // tab. The text stays in its box; only the pass stops.
  const tooLong = input.length > MAX_TEXT_LENGTH;
  const parsed = useMemo(() => (tooLong ? null : parseJson(input)), [input, tooLong]);

  const output = useMemo(() => {
    if (!parsed?.ok) return "";
    if (layout === "minified") return minifyJson(parsed.value);
    return stringifyJson(parsed.value, indent === "tab" ? "\t" : Number(indent), sortKeys);
  }, [parsed, layout, indent, sortKeys]);

  const stats = useMemo(() => (parsed?.ok ? countKeys(parsed.value) : null), [parsed]);

  const hasInput = input.trim().length > 0;
  const valid = parsed?.ok === true;
  const invalid = hasInput && !tooLong && parsed?.ok === false;
  const indentValue = indent === "tab" ? "\t" : " ".repeat(Number(indent));

  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="JSON input"
        value={input}
        onChange={setInput}
        rows={10}
        mono
        invalid={invalid}
        describedBy={invalid ? "json-error" : undefined}
        placeholder='{ "hello": "world" }'
      />

      {hasInput ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInput(SAMPLE)}>
            Load sample
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput("")}>
            Clear
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Segmented<Layout>
          label="Output"
          value={layout}
          onChange={setLayout}
          options={[
            { value: "pretty", label: "Formatted" },
            { value: "minified", label: "Minified" },
          ]}
        />
        <Select
          label="Indent"
          value={indent}
          onChange={setIndent}
          disabled={layout === "minified"}
          options={[
            { value: "2", label: "2 spaces" },
            { value: "4", label: "4 spaces" },
            { value: "tab", label: "Tab" },
          ]}
        />
      </div>

      <Check checked={sortKeys} onChange={setSortKeys} label="Sort object keys alphabetically" hint="Useful for comparing two payloads. Insertion order is kept otherwise." />

      {hasInput && !tooLong ? (
        <p
          id="json-error"
          role={valid ? "status" : "alert"}
          className={
            valid
              ? "text-sm text-muted"
              : "rounded-md border border-highlight/45 bg-highlight/5 px-3.5 py-3 text-sm text-highlight-strong"
          }
        >
          {valid ? (
            <>
              Valid JSON. {" "}
              <span className="num">
                {formatNumber(stats?.objects ?? 0)} objects, {formatNumber(stats?.arrays ?? 0)} arrays,{" "}
                {formatNumber(stats?.leaves ?? 0)} values
              </span>
              .
            </>
          ) : (
            <>
              {parsed?.message} Line <span className="num">{parsed?.line}</span>, column{" "}
              <span className="num">{parsed?.column}</span>.
            </>
          )}
        </p>
      ) : null}

      {stats ? (
        <StatGrid className="lg:grid-cols-4">
          <Stat label="Objects" value={formatNumber(stats.objects)} />
          <Stat label="Arrays" value={formatNumber(stats.arrays)} />
          <Stat label="Values" value={formatNumber(stats.leaves)} />
          <Stat label="Output size" value={formatBytes(new Blob([output]).size)} />
        </StatGrid>
      ) : null}

      <div>
        <ResultFooter>
          <CopyButton value={output} disabled={!valid} />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!valid}
            onClick={() => downloadText(output, "formatted.json", "application/json")}
          >
            Download
          </button>
        </ResultFooter>
        {tooLong ? (
          <LimitNote length={input.length} limit={MAX_TEXT_LENGTH} />
        ) : valid ? (
          <OutputBox as="pre">
            {output.length > 0 ? output : "{}"}
          </OutputBox>
        ) : (
          <Empty
            action={
              hasInput ? undefined : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInput(SAMPLE)}>
                  Try an example
                </button>
              )
            }
          >
            {hasInput
              ? "Fix the error above and the formatted output will appear here."
              : "Paste some JSON to format it — nothing is uploaded."}
          </Empty>
        )}
      </div>

      <Note>
        Parsing uses the browser&apos;s own JSON parser, so a payload containing credentials or
        customer data never leaves your machine. Whitespace <em>inside the output</em> uses{" "}
        <code className="font-mono">{indentValue === "\t" ? "\\t" : `${indentValue.length} spaces`}</code>.
      </Note>
    </div>
  );
}
