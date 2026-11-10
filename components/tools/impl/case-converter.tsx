"use client";

import { useMemo, useState } from "react";

import { CopyButton, TextArea } from "@/components/tools/interactive";
import { Empty, Note } from "@/components/tools/parts";
import { CASE_IDS, CASE_LABELS, applyCase, countCharacters, type CaseId } from "@/lib/text";
import { cn, formatNumber } from "@/lib/utils";

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [active, setActive] = useState<CaseId>("upper");

  const result = useMemo(() => applyCase(text, active), [text, active]);
  const hasText = text.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Original text"
        value={text}
        onChange={setText}
        rows={8}
        placeholder="Paste the text you want to convert…"
      />

      <div>
        <span className="label">Convert to</span>
        <div role="group" aria-label="Convert to" className="flex flex-wrap gap-2">
          {CASE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={active === id}
              onClick={() => setActive(id)}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-[0.8125rem] transition-colors duration-150 ease-out",
                active === id
                  ? "border-accent bg-surface-2 text-fg"
                  : "border-line text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {CASE_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="label mb-0">Result — {CASE_LABELS[active]}</span>
          <CopyButton value={result} disabled={!hasText} />
        </div>
        {hasText ? (
          <textarea
            className="field field-mono"
            rows={8}
            readOnly
            value={result}
            aria-label={`Converted text in ${CASE_LABELS[active]}`}
          />
        ) : (
          <Empty>Your converted text will appear here.</Empty>
        )}
        {hasText ? (
          <p className="hint mt-1.5 num">
            {formatNumber(countCharacters(result, true))} characters
          </p>
        ) : null}
      </div>

      <Note>
        Conversion follows Unicode casing rules, so accented Latin letters, Greek and Cyrillic change
        case correctly and scripts without letter case, such as Chinese, are left alone. Your
        original text is never modified.
      </Note>
    </div>
  );
}
