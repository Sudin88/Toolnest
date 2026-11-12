"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Select, TextArea } from "@/components/tools/interactive";
import { LimitNote, Note, Stat, StatGrid } from "@/components/tools/parts";
import {
  DEFER_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
  countCharacters,
  countWords,
  utf16Length,
  utf8ByteLength,
} from "@/lib/text";
import { useToolInput } from "@/lib/tool-input";
import { cn, formatNumber } from "@/lib/utils";

const LIMITS = [
  { value: "none", label: "No limit", max: 0 },
  { value: "title", label: "SEO page title (60)", max: 60 },
  { value: "meta", label: "Meta description (155)", max: 155 },
  { value: "tweet", label: "X post (280)", max: 280 },
  { value: "sms", label: "SMS segment (160)", max: 160 },
  { value: "instagram", label: "Instagram caption (2200)", max: 2200 },
];

export default function CharacterCounter() {
  // The same main-input contract as its text siblings: a draft survives a
  // reload, and pasted text handed over from the home box is applied once.
  const [text, setText] = useToolInput<string>("character-counter", "text", "", { handover: true });
  const [limitId, setLimitId] = useState("none");

  // The byte count allocates a `Uint8Array` the size of the text on every pass,
  // so above the defer threshold the metrics run on a value that lags a render
  // rather than on every keystroke. Below it they stay live.
  //
  // Past the cap the metrics are not computed at all: an empty source keeps that
  // allocation off a multi-megabyte paste entirely. The text stays in its box;
  // only the counting stops.
  const tooLong = text.length > MAX_TEXT_LENGTH;
  const deferred = useDeferredValue(text);
  const source = tooLong ? "" : text.length > DEFER_TEXT_LENGTH ? deferred : text;

  const stats = useMemo(
    () => ({
      withSpaces: countCharacters(source, true),
      withoutSpaces: countCharacters(source, false),
      utf16: utf16Length(source),
      bytes: utf8ByteLength(source),
      words: countWords(source),
    }),
    [source],
  );

  const limit = LIMITS.find((item) => item.value === limitId) ?? LIMITS[0];
  const over = limit.max > 0 && stats.withSpaces > limit.max;
  const atWarn = limit.max > 0 && !over && stats.withSpaces > limit.max * 0.9;
  const usedPct = limit.max > 0 ? Math.min(100, (stats.withSpaces / limit.max) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Your text"
        value={text}
        onChange={setText}
        rows={10}
        placeholder="Paste the copy you need to measure…"
      />

      {tooLong ? (
        <LimitNote length={text.length} limit={MAX_TEXT_LENGTH} />
      ) : (
        <>
          <StatGrid>
            <Stat label="With spaces" value={formatNumber(stats.withSpaces)} />
            <Stat label="Without spaces" value={formatNumber(stats.withoutSpaces)} />
            <Stat label="Words" value={formatNumber(stats.words)} />
            <Stat
              label="UTF-8 bytes"
              value={formatNumber(stats.bytes)}
              hint={`${formatNumber(stats.utf16)} UTF-16 code units`}
            />
          </StatGrid>

          <div className="flex flex-col gap-3">
            <Select
              label="Check against a limit"
              value={limitId}
              onChange={setLimitId}
              options={LIMITS.map((item) => ({ value: item.value, label: item.label }))}
            />

            {limit.max > 0 ? (
              <>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
                  role="img"
                  aria-label={`${stats.withSpaces} of ${limit.max} characters used`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-colors duration-150 ease-out",
                      over ? "bg-highlight" : atWarn ? "bg-highlight/70" : "bg-accent",
                    )}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <p
                  className={cn("text-sm", over ? "text-highlight-strong" : "text-muted")}
                  role="status"
                >
                  <span className="num font-semibold text-fg">{formatNumber(stats.withSpaces)}</span> of{" "}
                  <span className="num">{formatNumber(limit.max)}</span> characters,{" "}
                  {over
                    ? `${formatNumber(stats.withSpaces - limit.max)} over the limit`
                    : `${formatNumber(limit.max - stats.withSpaces)} to spare`}
                  .
                </p>
              </>
            ) : null}
          </div>
        </>
      )}

      <Note>
        Characters with and without spaces differ by the number of spaces, and that count is
        significant. Many editors and social platforms include them. The byte figure matters when a
        system measures bytes rather than characters, such as an SMS or a database column.
      </Note>
    </div>
  );
}
