"use client";

import { useMemo } from "react";

import { NumberInput, Segmented } from "@/components/tools/interactive";
import { Note } from "@/components/tools/parts";
import { isWhatPercent, percentChange, percentOf } from "@/lib/calc";
import { useToolDraft } from "@/lib/tool-draft";

type Mode = "of" | "isPercent" | "change";

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);

export default function PercentageCalculator() {
  const [mode, setMode] = useToolDraft<Mode>("percentage-calculator", "mode", "of");
  const [a, setA] = useToolDraft<number | "">("percentage-calculator", "a", 25);
  const [b, setB] = useToolDraft<number | "">("percentage-calculator", "b", 200);

  const result = useMemo(() => {
    if (a === "" || b === "") return null;

    if (mode === "of") {
      return { value: fmt(percentOf(a, b)), formula: `${fmt(a)}% × ${fmt(b)}` };
    }
    if (mode === "isPercent") {
      const percent = isWhatPercent(a, b);
      return percent === null
        ? { value: "—", formula: "Cannot divide by zero", error: true }
        : { value: `${fmt(percent)}%`, formula: `${fmt(a)} ÷ ${fmt(b)} × 100` };
    }
    const change = percentChange(a, b);
    if (change.change === null) return { value: "—", formula: "A change from zero has no percentage", error: true };
    const sign = change.change > 0 ? "+" : "";
    const article = change.direction === "increase" ? "an" : "a";
    return {
      value: `${sign}${fmt(change.change)}%`,
      formula: `(${fmt(b)} − ${fmt(a)}) ÷ |${fmt(a)}| × 100, ${article} ${change.direction}`,
    };
  }, [mode, a, b]);

  return (
    <div className="flex flex-col gap-6">
      <Segmented<Mode>
        label="What do you want to work out?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "of", label: "A percent of a number" },
          { value: "isPercent", label: "One number of another" },
          { value: "change", label: "Increase or decrease" },
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberInput
          label={mode === "of" ? "Percentage (%)" : mode === "isPercent" ? "Part" : "From"}
          value={a}
          onChange={setA}
        />
        <NumberInput
          label={mode === "of" ? "Of number" : mode === "isPercent" ? "Whole" : "To"}
          value={b}
          onChange={setB}
        />
      </div>

      <div className="panel p-5 sm:p-6">
        {result ? (
          <>
            <p className="text-sm text-muted">
              {mode === "of"
                ? `${a === "" ? "" : fmt(a)}% of ${b === "" ? "" : fmt(b)} is`
                : mode === "isPercent"
                  ? `${a === "" ? "" : fmt(a)} is this much of ${b === "" ? "" : fmt(b)}`
                  : `From ${a === "" ? "" : fmt(a)} to ${b === "" ? "" : fmt(b)}`}
            </p>
            <p className="num mt-1 text-4xl font-extrabold tracking-tight text-fg">
              {result.value}
            </p>
            <p className="field-mono mt-3 text-xs text-muted">{result.formula}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Enter both numbers to see the result.</p>
        )}
      </div>

      <Note>
        A move from 10% to 15% is a 5 <em>percentage point</em> rise but a 50% <em>increase</em>,
        because the change is measured against the starting value. Percentages are not reversible:
        a 50% rise needs a 33% fall to get back, since the second calculation uses a larger base.
      </Note>
    </div>
  );
}
