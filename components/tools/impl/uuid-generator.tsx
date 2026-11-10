"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, CopyButton, NumberInput, Segmented } from "@/components/tools/interactive";
import { Empty, Note, OutputBox } from "@/components/tools/parts";
import { downloadText } from "@/lib/download";
import { generateUuids, type UuidVersion } from "@/lib/ids";
import { formatNumber } from "@/lib/utils";

export default function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState<number | "">(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [values, setValues] = useState<string[]>([]);

  const options = useMemo(
    () => ({ version, count: typeof count === "number" ? count : 1, uppercase, hyphens }),
    [version, count, uppercase, hyphens],
  );

  // Generated in an effect so nothing random runs during prerendering.
  useEffect(() => {
    setValues(generateUuids(options));
  }, [options]);

  const joined = values.join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Segmented<UuidVersion>
          label="Version"
          value={version}
          onChange={setVersion}
          options={[
            { value: "v4", label: "v4 (random)" },
            { value: "v7", label: "v7 (time-ordered)" },
          ]}
        />
        <NumberInput
          label="How many"
          value={count}
          min={1}
          max={1000}
          onChange={setCount}
          hint="Up to 1,000 at a time."
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Check checked={hyphens} onChange={setHyphens} label="Include hyphens" />
        <Check checked={uppercase} onChange={setUppercase} label="Uppercase" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setValues(generateUuids(options))}>
          Generate again
        </button>
        <CopyButton value={joined} label="Copy all" disabled={values.length === 0} />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={values.length === 0}
          onClick={() => downloadText(joined, "uuids.txt")}
        >
          Download .txt
        </button>
        <span className="num ml-auto text-sm text-muted">
          {formatNumber(values.length)} {values.length === 1 ? "identifier" : "identifiers"}
        </span>
      </div>

      {values.length > 0 ? (
        <OutputBox>
          {values.map((value) => (
            <span key={value} className="block">
              {value}
            </span>
          ))}
        </OutputBox>
      ) : (
        <Empty>Generating…</Empty>
      )}

      <Note>
        These come from the browser&apos;s cryptographically secure random generator — the same
        source used for encryption keys. Version 7 begins with a millisecond timestamp, so later
        identifiers sort after earlier ones, which keeps a database index dense.
      </Note>
    </div>
  );
}
