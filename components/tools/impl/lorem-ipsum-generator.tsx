"use client";

import { useEffect, useState } from "react";

import { Check, CopyButton, NumberInput, Segmented } from "@/components/tools/interactive";
import { Note, OutputBox } from "@/components/tools/parts";
import { downloadText } from "@/lib/download";
import { generateLorem, type LoremUnit } from "@/lib/lorem";
import { formatNumber } from "@/lib/utils";

export default function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<LoremUnit>("paragraphs");
  const [count, setCount] = useState<number | "">(3);
  const [traditional, setTraditional] = useState(false);
  const [output, setOutput] = useState("");

  function generate(next?: { unit?: LoremUnit; count?: number | ""; traditional?: boolean }) {
    const u = next?.unit ?? unit;
    const c = next?.count ?? count;
    const t = next?.traditional ?? traditional;
    setOutput(generateLorem(u, typeof c === "number" ? c : 1, t));
  }

  // Seed with a sample on first paint so the panel is never empty. This runs in
  // the browser only, so nothing random is generated during prerendering.
  useEffect(() => {
    setOutput(generateLorem("paragraphs", 3, false));
  }, []);

  const words = output.trim() ? output.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Segmented<LoremUnit>
          label="Generate"
          value={unit}
          onChange={(value) => {
            setUnit(value);
            generate({ unit: value });
          }}
          options={[
            { value: "paragraphs", label: "Paragraphs" },
            { value: "sentences", label: "Sentences" },
            { value: "words", label: "Words" },
          ]}
        />
        <NumberInput
          label="How many"
          value={count}
          min={1}
          max={200}
          onChange={(value) => {
            setCount(value);
            generate({ count: value });
          }}
        />
      </div>

      <Check
        checked={traditional}
        onChange={(value) => {
          setTraditional(value);
          generate({ traditional: value });
        }}
        label="Start with the traditional “Lorem ipsum dolor sit amet…” opening"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => generate()}>
          Generate again
        </button>
        <CopyButton value={output} />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => downloadText(output, "lorem-ipsum.txt")}
        >
          Download .txt
        </button>
        <span className="num ml-auto text-sm text-muted">{formatNumber(words)} words</span>
      </div>

      <OutputBox>{output}</OutputBox>

      <Note>
        The output is drawn at random from the standard lorem ipsum vocabulary, so repeated runs
        differ while the shape of the text stays consistent — which is the point when you are
        filling a layout.
      </Note>
    </div>
  );
}
