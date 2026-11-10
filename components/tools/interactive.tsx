"use client";

import { Check as CheckIcon, Copy, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import { copyText } from "@/lib/download";
import { cn } from "@/lib/utils";

/**
 * Interactive form building blocks. These live in one client module so each tool
 * only describes its own logic rather than re-deriving field markup.
 */

/* ------------------------------------------------------------------ fields */

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="hint mt-1.5">{hint}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 8,
  mono,
  invalid,
  describedBy,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={cn("field", mono && "field-mono")}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      />
      {hint ? <p className="hint mt-1.5">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  mono,
  inputMode,
  type = "text",
  className,
  invalid,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "url";
  type?: string;
  className?: string;
  invalid?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      {label ? (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        className={cn("field", mono && "field-mono")}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="hint mt-1.5">{hint}</p> : null}
    </div>
  );
}

export function NumberInput({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="field num"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
      />
      {hint ? <p className="hint mt-1.5">{hint}</p> : null}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  className,
  hint,
  disabled,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="hint mt-1.5">{hint}</p> : null}
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
  hint,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <span className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label htmlFor={id} className="text-sm leading-snug text-fg">
          {label}
        </label>
      </span>
      {hint ? <p className="hint mt-1 pl-[1.625rem]">{hint}</p> : null}
    </div>
  );
}

export function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  className,
}: {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label className="label mb-0" htmlFor={id}>
          {label}
        </label>
        <span className="num text-sm font-semibold text-fg">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-[var(--accent)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/** A segmented control. Renders as buttons with a single selected state. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex flex-wrap gap-1 rounded-md border border-line bg-surface-2 p-1"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out",
                selected
                  ? "bg-surface text-fg shadow-xs"
                  : "text-muted hover:text-fg",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- clipboard */

export function CopyButton({
  value,
  label = "Copy",
  className,
  disabled,
  children,
}: {
  value: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = useCallback(async () => {
    const ok = await copyText(value);
    setState(ok ? "done" : "error");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1600);
  }, [value]);

  return (
    <button
      type="button"
      className={cn("btn btn-secondary btn-sm", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {state === "done" ? (
        <CheckIcon className="size-4 text-accent" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      {children ?? label}
      <span className="sr-only" role="status">
        {state === "done" ? "Copied to clipboard" : state === "error" ? "Copy failed" : ""}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------- file input */

export function FileDrop({
  onFile,
  accept,
  label,
  hint,
  multiple = false,
  className,
}: {
  onFile: (files: File[]) => void;
  accept?: string;
  /** Also used as the accessible name of the hidden file input. */
  label: string;
  hint?: ReactNode;
  multiple?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFile(Array.from(list));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className={className}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors duration-150 ease-out",
          dragging ? "border-accent bg-surface-2" : "border-line-strong bg-surface-2/60",
        )}
      >
        <span className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-accent">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-fg">{label}</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()}>
          Choose file{multiple ? "s" : ""}
        </button>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          aria-label={label}
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            // Allow re-selecting the same file.
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ states */

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return url;
}
