"use client";

import { useMemo, useState } from "react";

import { CopyButton, Segmented, TextArea } from "@/components/tools/interactive";
import { Empty, Note, OutputBox, ResultFooter, TryExample } from "@/components/tools/parts";
import { useToolInput } from "@/lib/tool-input";

type Mode = "encode" | "decode";
type Scope = "component" | "full";

const SAMPLE = "a name & a message = 100%";
const SAMPLE_ENCODED = "a%20name%20%26%20a%20message%20%3D%20100%25";

export default function UrlEncoderDecoder() {
  const [input, setInput] = useToolInput<string>("url-encoder-decoder", "input", "", {
    handover: true,
  });
  const [mode, setMode] = useState<Mode>("encode");
  const [scope, setScope] = useState<Scope>("component");

  const { output, error } = useMemo(() => {
    if (input.length === 0) return { output: "", error: null as string | null };
    try {
      if (mode === "encode") {
        return {
          output: scope === "component" ? encodeURIComponent(input) : encodeURI(input),
          error: null,
        };
      }
      return {
        output: scope === "component" ? decodeURIComponent(input) : decodeURI(input),
        error: null,
      };
    } catch {
      return {
        output: "",
        error:
          "That input is not valid percent-encoding. A percent sign must be followed by two hexadecimal digits: a stray “%” is the usual cause.",
      };
    }
  }, [input, mode, scope]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Segmented<Mode>
          label="Direction"
          value={mode}
          onChange={setMode}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
        <Segmented<Scope>
          label="Scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: "component", label: "Query value" },
            { value: "full", label: "Whole URL" },
          ]}
        />
      </div>

      <TextArea
        label={mode === "encode" ? "Text to encode" : "Encoded text to decode"}
        value={input}
        onChange={setInput}
        rows={5}
        mono
        invalid={Boolean(error)}
        placeholder={
          mode === "encode"
            ? "a name & a message = 100%"
            : "a%20name%20%26%20a%20message%20%3D%20100%25"
        }
      />

      <div>
        <ResultFooter>
          <CopyButton value={output} disabled={Boolean(error) || output.length === 0} />
        </ResultFooter>
        {input.length === 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <TryExample onClick={() => setInput(mode === "encode" ? SAMPLE : SAMPLE_ENCODED)} />
          </div>
        ) : null}
        {error ? (
          <p className="flex min-h-16 items-center rounded-md border border-highlight/45 bg-highlight/5 px-4 py-3 text-sm text-highlight-strong" role="alert">
            {error}
          </p>
        ) : output.length > 0 ? (
          <OutputBox>{output}</OutputBox>
        ) : (
          <Empty>The converted value will appear here as you type.</Empty>
        )}
      </div>

      <Note>
        <strong className="font-semibold text-fg">Query value</strong> escapes every reserved
        character, which is correct for a single parameter.{" "}
        <strong className="font-semibold text-fg">Whole URL</strong> leaves structural characters
        such as <code className="font-mono">/</code>, <code className="font-mono">?</code> and{" "}
        <code className="font-mono">:</code> intact so the address still parses.
      </Note>
    </div>
  );
}
