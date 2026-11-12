"use client";

import { useMemo, useState } from "react";

import { Check, CopyButton, NumberInput, Segmented } from "@/components/tools/interactive";
import { Empty, Note, OutputBox, SubHeading } from "@/components/tools/parts";
import { downloadText } from "@/lib/download";
import { randomDecimal, randomIntInclusive } from "@/lib/random";
import { formatNumber } from "@/lib/utils";

type Kind = "integer" | "decimal";

const MAX_COUNT = 1000;

export default function RandomNumberGenerator() {
  const [kind, setKind] = useState<Kind>("integer");
  const [min, setMin] = useState<number | "">(1);
  const [max, setMax] = useState<number | "">(100);
  const [decimals, setDecimals] = useState<number | "">(2);
  const [count, setCount] = useState<number | "">(1);
  const [includeEndpoints, setIncludeEndpoints] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [results, setResults] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Results belong to the settings that produced them, so any change to a
  // setting clears them: Copy and Download then disappear until Generate is
  // pressed again, and the file can never hold a number outside the visible
  // range. The memoised snapshot makes that one identity check.
  const settings = useMemo(
    () => ({ kind, min, max, decimals, count, includeEndpoints, allowDuplicates }),
    [kind, min, max, decimals, count, includeEndpoints, allowDuplicates],
  );
  const [built, setBuilt] = useState(settings);
  if (built !== settings) {
    setBuilt(settings);
    setResults([]);
    setError(null);
  }

  function generate() {
    setError(null);
    setResults([]);

    if (min === "" || max === "") {
      setError("Set both a minimum and a maximum.");
      return;
    }
    if (max < min) {
      setError("The maximum must be at least as large as the minimum.");
      return;
    }

    const total = Math.min(Math.max(Math.floor(count === "" ? 1 : Number(count)) || 1, 1), MAX_COUNT);

    if (kind === "decimal") {
      const places = Math.min(Math.max(Math.floor(decimals === "" ? 0 : Number(decimals)) || 0, 0), 8);
      const values = Array.from({ length: total }, () => randomDecimal(Number(min), Number(max), places));
      setResults(values);
      return;
    }

    const lower = Math.ceil(Number(min));
    const upper = Math.floor(Number(max));
    const low = includeEndpoints ? lower : lower + 1;
    const high = includeEndpoints ? upper : upper - 1;

    if (low > high) {
      setError("With the endpoints excluded there are no whole numbers left in this range.");
      return;
    }

    const span = high - low + 1;
    if (!allowDuplicates) {
      if (span < total) {
        setError(`Only ${span} distinct whole numbers exist in that range, so ${total} cannot all differ.`);
        return;
      }
      const chosen = new Set<number>();
      let attempts = 0;
      const cap = span * 20;
      while (chosen.size < total && attempts < cap) {
        chosen.add(randomIntInclusive(low, high));
        attempts += 1;
      }
      setResults([...chosen]);
      return;
    }

    setResults(Array.from({ length: total }, () => randomIntInclusive(low, high)));
  }

  const summary = results.join(kind === "decimal" ? "\n" : ", ");

  return (
    <div className="flex flex-col gap-6">
      <Segmented<Kind>
        label="What kind of numbers?"
        value={kind}
        onChange={setKind}
        options={[
          { value: "integer", label: "Whole numbers" },
          { value: "decimal", label: "Decimals" },
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <NumberInput label="Minimum" value={min} onChange={setMin} />
        <NumberInput label="Maximum" value={max} onChange={setMax} />
        {kind === "decimal" ? (
          <NumberInput label="Decimal places" value={decimals} onChange={setDecimals} min={0} max={8} />
        ) : (
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
        )}
      </div>

      {kind === "decimal" ? (
        <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
      ) : null}

      {kind === "integer" ? (
        <Check
          label="The minimum and maximum may be picked"
          checked={includeEndpoints}
          onChange={setIncludeEndpoints}
          hint="Turn off to treat them as boundaries that are never returned."
        />
      ) : null}

      {kind === "integer" ? (
        <Check
          label="Allow duplicates"
          checked={allowDuplicates}
          onChange={setAllowDuplicates}
          hint="Switch off to draw without replacement, which is what a raffle needs."
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={generate}>
          Generate
        </button>
        {results.length > 0 ? (
          <CopyButton value={summary} label="Copy results" />
        ) : null}
        {results.length > 0 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => downloadText(summary, "random-numbers.txt")}
          >
            Download
          </button>
        ) : null}
      </div>

      {error ? <Note tone="warn">{error}</Note> : null}

      <div>
        <SubHeading id="rng-results">
          {results.length > 0
            ? `${formatNumber(results.length)} ${results.length === 1 ? "number" : "numbers"}`
            : "Results"}
        </SubHeading>
        <div className="mt-3">
          {results.length === 0 ? (
            <Empty>
              {error ? "Adjust the settings above and generate again." : "Your numbers will appear here."}
            </Empty>
          ) : (
            <OutputBox>{summary}</OutputBox>
          )}
        </div>
      </div>

      <Note>
        Values come from the browser&rsquo;s cryptographic random source and are mapped into the range
        with rejection sampling, which avoids the small bias a plain modulo introduces. That is more
        than good enough for picking who goes first. For anything with money or legal weight, use a
        draw process a third party can audit. No web page can prove it was fair.
      </Note>
    </div>
  );
}
