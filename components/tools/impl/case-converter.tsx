"use client";

import { useMemo } from "react";

import { CopyButton, TextArea } from "@/components/tools/interactive";
import { Empty, LimitNote, Note, ResultFooter, TryExample } from "@/components/tools/parts";
import { CASE_IDS, CASE_LABELS, MAX_TEXT_LENGTH, applyCase, countCharacters, type CaseId } from "@/lib/text";
import { draftOneOf, useToolDraft } from "@/lib/tool-draft";
import { useToolInput } from "@/lib/tool-input";
import { cn, formatNumber } from "@/lib/utils";

const SAMPLE = "the QUICK brown fox JUMPS over the lazy dog";

// A stale or hand-edited draft can hold a case id this build no longer defines,
// which would render `undefined` in the result footer and in the textarea's
// label. Decoding falls back to the initial value instead.
const decodeCase = draftOneOf(CASE_IDS);

export default function CaseConverter() {
  const [text, setText] = useToolInput<string>("case-converter", "text", "", { handover: true });
  const [active, setActive] = useToolDraft<CaseId>("case-converter", "active", "upper", { decode: decodeCase });

  // Past the cap the conversion is skipped rather than run on every keystroke —
  // the case walk over a multi-megabyte paste is what stalls the tab.
  const tooLong = text.length > MAX_TEXT_LENGTH;
  const result = useMemo(() => (tooLong ? "" : applyCase(text, active)), [text, active, tooLong]);
  const showResult = !tooLong && text.trim().length > 0;

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
        <ResultFooter label={`Result: ${CASE_LABELS[active]}`}>
          <CopyButton value={result} disabled={!showResult} />
        </ResultFooter>
        {tooLong ? (
          <LimitNote length={text.length} limit={MAX_TEXT_LENGTH} />
        ) : showResult ? (
          <textarea
            className="field field-mono"
            rows={8}
            readOnly
            value={result}
            aria-label={`Converted text in ${CASE_LABELS[active]}`}
          />
        ) : (
          <Empty action={<TryExample onClick={() => setText(SAMPLE)} />}>
            Your converted text will appear here.
          </Empty>
        )}
        {showResult ? (
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
