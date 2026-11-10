"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, CopyButton, RangeInput } from "@/components/tools/interactive";
import { Note } from "@/components/tools/parts";
import { buildAlphabet, generatePassword, passwordStrength, type PasswordOptions } from "@/lib/ids";
import { cn } from "@/lib/utils";

const TONE_STYLES: Record<string, string> = {
  weak: "bg-highlight",
  fair: "bg-highlight/70",
  strong: "bg-accent/70",
  "very-strong": "bg-accent",
};

export default function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
    avoidAmbiguous: false,
  });
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);

  const strength = useMemo(() => passwordStrength(options), [options]);
  const alphabetSize = useMemo(() => buildAlphabet(options).length, [options]);
  const feasible = alphabetSize > 0;

  // Regenerate whenever the pool changes. Runs only in the browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cryptographic randomness must be drawn after hydration; generating during render would mismatch the prerendered HTML
    if (feasible) setPassword(generatePassword(options));
  }, [options, feasible]);

  function update(patch: Partial<PasswordOptions>) {
    setOptions((current) => ({ ...current, ...patch }));
  }

  const selectedSets = [options.lowercase, options.uppercase, options.digits, options.symbols].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <output
            className={cn(
              "field-mono min-w-0 flex-1 break-all rounded-md border border-line bg-surface-2 px-3.5 py-3 text-base text-fg",
              !visible && "blur-[5px] select-none",
            )}
            aria-label="Generated password"
          >
            {password || "Select at least one character set"}
          </output>
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0"
            aria-pressed={!visible}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn("h-full rounded-full transition-all duration-150 ease-out", TONE_STYLES[strength.tone])}
              style={{ width: `${Math.min(100, (strength.bits / 128) * 100)}%` }}
            />
          </div>
          <span className="w-28 shrink-0 text-right text-sm font-semibold text-fg">
            {strength.label}
            <span className="num ml-1 font-normal text-muted">{strength.bits} bits</span>
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!feasible}
            onClick={() => setPassword(generatePassword(options))}
          >
            Generate new
          </button>
          <CopyButton value={password} disabled={!feasible} />
        </div>
      </div>

      <RangeInput
        label="Length"
        value={options.length}
        min={4}
        max={64}
        onChange={(length) => update({ length })}
      />

      <fieldset className="grid gap-3.5 sm:grid-cols-2">
        <legend className="label">Character sets</legend>
        <Check
          checked={options.lowercase}
          onChange={(lowercase) => update({ lowercase })}
          label="Lowercase letters — a–z"
        />
        <Check
          checked={options.uppercase}
          onChange={(uppercase) => update({ uppercase })}
          label="Uppercase letters — A–Z"
        />
        <Check checked={options.digits} onChange={(digits) => update({ digits })} label="Digits — 0–9" />
        <Check
          checked={options.symbols}
          onChange={(symbols) => update({ symbols })}
          label="Symbols — !@#$%…"
        />
        <Check
          checked={options.avoidAmbiguous}
          onChange={(avoidAmbiguous) => update({ avoidAmbiguous })}
          label="Exclude easily confused characters"
          hint="Removes l, I, 1, O and 0 — helpful when a human has to retype it."
        />
      </fieldset>

      {!feasible ? (
        <Note tone="warn">Choose at least one character set — there is nothing to draw from.</Note>
      ) : (
        <Note>
          {selectedSets} of 4 sets selected, so each character has {alphabetSize} possibilities. The
          password is drawn with the browser&apos;s cryptographic random generator, shown here, and
          never stored or transmitted — copy it into your password manager now, because leaving this
          page discards it.
        </Note>
      )}
    </div>
  );
}
