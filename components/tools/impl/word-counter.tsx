"use client";

import { useMemo } from "react";

import { CopyButton, TextArea } from "@/components/tools/interactive";
import { Note, ResultFooter, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import {
  countCharacters,
  countParagraphs,
  countSentences,
  countWords,
  keywordFrequency,
  readingTime,
  utf8ByteLength,
} from "@/lib/text";
import { useToolInput } from "@/lib/tool-input";
import { formatNumber } from "@/lib/utils";

const SAMPLE = `Small tools are worth doing properly. A word counter that runs in the tab, a converter that never uploads your file, a calculator that asks nothing of you.

Paste your own draft here and the counts update as you type — the reading time, the sentences, the terms you lean on. Nothing is sent anywhere.`;

export default function WordCounter() {
  const [text, setText] = useToolInput<string>("word-counter", "text", "", { handover: true });

  const stats = useMemo(() => {
    const words = countWords(text);
    return {
      words,
      characters: countCharacters(text, true),
      sentences: countSentences(text),
      paragraphs: countParagraphs(text),
      reading: readingTime(words),
      bytes: utf8ByteLength(text),
    };
  }, [text]);

  const keywords = useMemo(() => keywordFrequency(text, 10), [text]);
  const topCount = keywords[0]?.count ?? 0;

  const summary = [
    `Words: ${formatNumber(stats.words)}`,
    `Characters: ${formatNumber(stats.characters)}`,
    `Sentences: ${formatNumber(stats.sentences)}`,
    `Paragraphs: ${formatNumber(stats.paragraphs)}`,
  ].join("\n");

  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Your text"
        value={text}
        onChange={setText}
        rows={12}
        placeholder="Type or paste here — the counts update as you go."
        hint="The text stays in this tab. Nothing is sent anywhere."
      />

      {text.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          <TryExample onClick={() => setText(SAMPLE)} />
        </div>
      ) : null}

      <StatGrid>
        <Stat label="Words" value={formatNumber(stats.words)} />
        <Stat label="Characters" value={formatNumber(stats.characters)} hint={`${formatNumber(stats.bytes)} bytes in UTF-8`} />
        <Stat label="Sentences" value={formatNumber(stats.sentences)} />
        <Stat label="Paragraphs" value={formatNumber(stats.paragraphs)} />
      </StatGrid>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Reading time{" "}
          <strong className="font-semibold text-fg">
            {stats.reading.minutes > 0
              ? `${stats.reading.minutes} min`
              : stats.reading.seconds > 0
                ? `${stats.reading.seconds} sec`
                : "—"}
          </strong>{" "}
          at 200 words per minute.
        </p>
        <ResultFooter label="Summary" className="mb-0 w-full sm:w-auto">
          <CopyButton value={summary} label="Copy summary" disabled={text.length === 0} />
        </ResultFooter>      </div>

      <div>
        <h3 className="font-display text-[0.9375rem] font-bold text-fg">Most used words</h3>
        {keywords.length === 0 ? (
          <Note className="mt-3">
            Common words like “the” and “and” are ignored. Add some prose and the terms you lean on
            will appear here.
          </Note>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {keywords.map((keyword) => (
              <li key={keyword.word} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm font-medium text-fg">
                  {keyword.word}
                </span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${topCount ? (keyword.count / topCount) * 100 : 0}%` }}
                  />
                </span>
                <span className="num w-14 shrink-0 text-right text-sm text-muted">
                  {formatNumber(keyword.count)}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
