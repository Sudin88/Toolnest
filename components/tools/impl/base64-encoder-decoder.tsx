"use client";

import { useMemo, useState } from "react";

import { Check, CopyButton, Segmented, TextArea } from "@/components/tools/interactive";
import { Empty, LimitNote, Note, OutputBox, ResultFooter, Stat, StatGrid, TryExample } from "@/components/tools/parts";
import { decodeBase64, encodeBase64 } from "@/lib/base64";
import { downloadText } from "@/lib/download";
import { MAX_TEXT_LENGTH } from "@/lib/text";
import { useToolInput } from "@/lib/tool-input";
import { formatNumber } from "@/lib/utils";

type Mode = "encode" | "decode";

const SAMPLE_TEXT = "Small tools, done properly.";
const SAMPLE_BASE64 = "U21hbGwgdG9vbHMsIGRvbmUgcHJvcGVybHku";

export default function Base64EncoderDecoder() {
  const [input, setInput] = useToolInput<string>("base64-encoder-decoder", "input", "", {
    handover: true,
  });
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [tolerant, setTolerant] = useState(true);

  // Decode carries its own ceiling and reports it through `error`. Encode has
  // none of its own, so past the shared text cap it is skipped rather than
  // allocating several copies of a multi-megabyte string on every keystroke.
  const tooLong = mode === "encode" && input.length > MAX_TEXT_LENGTH;

  const result = useMemo(() => {
    if (mode === "encode") {
      return tooLong
        ? { output: "", error: null as string | null }
        : { output: encodeBase64(input, urlSafe), error: null as string | null };
    }
    const decoded = decodeBase64(input, tolerant);
    return decoded.ok
      ? { output: decoded.text, error: null as string | null }
      : { output: "", error: decoded.error };
  }, [input, mode, urlSafe, tolerant, tooLong]);

  const hasInput = input.length > 0;
  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputBytes = useMemo(() => new TextEncoder().encode(result.output).length, [result.output]);

  return (
    <div className="flex flex-col gap-6">
      <Segmented<Mode>
        label="Direction"
        value={mode}
        onChange={setMode}
        options={[
          { value: "encode", label: "Text → base64" },
          { value: "decode", label: "Base64 → text" },
        ]}
      />

      <TextArea
        label={mode === "encode" ? "Text" : "Base64"}
        value={input}
        onChange={setInput}
        rows={7}
        mono
        invalid={Boolean(result.error)}
        placeholder={mode === "encode" ? "Hello, world!" : "SGVsbG8sIHdvcmxkIQ=="}
      />

      {mode === "encode" ? (
        <Check checked={urlSafe} onChange={setUrlSafe} label="URL-safe output" hint="Uses - and _ instead of + and /, and drops padding: the form to put in a query string." />
      ) : (
        <Check checked={tolerant} onChange={setTolerant} label="Tolerate missing padding" hint="Repairs the length if the string came from a system that strips the = characters." />
      )}

      {!hasInput ? (
        <div className="flex flex-wrap gap-2">
          <TryExample
            onClick={() => setInput(mode === "encode" ? SAMPLE_TEXT : SAMPLE_BASE64)}
          />
        </div>
      ) : null}

      <StatGrid className="lg:grid-cols-3">
        <Stat label="Input bytes" value={formatNumber(inputBytes)} />
        <Stat label="Output bytes" value={formatNumber(outputBytes)} />
        <Stat
          label="Overhead"
          value={
            mode === "encode" && inputBytes > 0
              ? `${Math.round(((outputBytes - inputBytes) / inputBytes) * 100)}%`
              : "-"
          }
          hint={mode === "encode" ? "Base64 adds about a third" : undefined}
        />
      </StatGrid>

      <div>
        <ResultFooter>
          <CopyButton value={result.output} disabled={!hasInput || Boolean(result.error) || tooLong} />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!hasInput || Boolean(result.error) || tooLong}
            onClick={() => downloadText(result.output, mode === "encode" ? "encoded.txt" : "decoded.txt")}
          >
            Download
          </button>
        </ResultFooter>
        {tooLong ? (
          <LimitNote length={input.length} limit={MAX_TEXT_LENGTH} />
        ) : result.error ? (
          <p
            role="alert"
            className="rounded-md border border-highlight/45 bg-highlight/5 px-3.5 py-3 text-sm text-highlight-strong"
          >
            {result.error}
          </p>
        ) : hasInput ? (
          <OutputBox>{result.output.length > 0 ? result.output : "(empty result)"}</OutputBox>
        ) : (
          <Empty>Paste {mode === "encode" ? "some text" : "a base64 string"} to convert it.</Empty>
        )}
      </div>

      <Note tone="warn">
        Base64 is a transport encoding, not encryption. Anyone can reverse it, so never use it to
        hide a secret, only to carry bytes safely through a text-only channel.
      </Note>
    </div>
  );
}
