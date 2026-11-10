"use client";

import { useMemo, useState } from "react";

import { Check, CopyButton, Segmented, Select, TextArea } from "@/components/tools/interactive";
import { Empty, Note, OutputBox, Stat, StatGrid } from "@/components/tools/parts";
import { downloadText } from "@/lib/download";
import { countKeys, minifyJson, parseJson, stringifyJson } from "@/lib/json-tool";
import { formatBytes, formatNumber } from "@/lib/utils";

const SAMPLE = `{
  "name": "ToolNest",
  "tools": 35,
  "categories": ["pdf", "image", "text"],
  "free": true,
  "creator": { "private": false, "note": "no account needed" }
}`;

type Layout = "pretty" | "minified";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [layout, setLayout] = useState<Layout>("pretty");
  const [indent, setIndent] = useState("2");
  const [sortKeys, setSortKeys] = useState(false);

  const parsed = useMemo(() => parseJson(input), [input]);

  const output = useMemo(() => {
    if (!parsed.ok) return "";
    if (layout === "minified") return minifyJson(parsed.value);
    return stringifyJson(parsed.value, indent === "tab" ? 1 : Number(indent), sortKeys);
  }, [parsed, layout, indent, sortKeys]);

  const stats = useMemo(
    () => (parsed.ok ? countKeys(parsed.value) : null),
    [parsed],
  );

  const hasInput = input.trim().length > 0;
  const indentValue = indent === "tab" ? "\t" : " ".repeat(Number(indent));

  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="JSON input"
        value={input}
        onChange={setInput}
        rows={10}
        mono
        invalid={hasInput && !parsed.ok}
        describedBy={hasInput && !parsed.ok ? "json-error" : undefined}
        placeholder='{ "hello": "world" }'
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInput(SAMPLE)}>
          Load sample
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput("")} disabled={!hasInput}>
          Clear
        </button>
      </div>

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

      {hasInput ? (
        <p
          id="json-error"
          role={parsed.ok ? "status" : "alert"}
          className={
            parsed.ok
              ? "text-sm text-muted"
              : "rounded-md border border-highlight/45 bg-highlight/5 px-3.5 py-3 text-sm text-highlight-strong"
          }
        >
          {parsed.ok ? (
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
              {parsed.message} Line <span className="num">{parsed.line}</span>, column{" "}
              <span className="num">{parsed.column}</span>.
            </>
          )}
        </p>
      ) : null}

      {parsed.ok && stats ? (
        <StatGrid className="lg:grid-cols-4">
          <Stat label="Objects" value={formatNumber(stats.objects)} />
          <Stat label="Arrays" value={formatNumber(stats.arrays)} />
          <Stat label="Values" value={formatNumber(stats.leaves)} />
          <Stat label="Output size" value={formatBytes(new Blob([output]).size)} />
        </StatGrid>
      ) : null}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="label mb-0">Result</span>
          <div className="flex gap-2">
            <CopyButton value={output} disabled={!parsed.ok} />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!parsed.ok}
              onClick={() => downloadText(output, "formatted.json", "application/json")}
            >
              Download
            </button>
          </div>
        </div>
        {parsed.ok ? (
          <OutputBox as="pre">
            {output.length > 0 ? output : "{}"}
          </OutputBox>
        ) : (
          <Empty>
            {hasInput ? "Fix the error above and the formatted output will appear here." : "Paste some JSON to format it."}
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
