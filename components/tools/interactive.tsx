"use client";

import { ArrowDown, ArrowUp, Check as CheckIcon, Copy, Upload, X } from "lucide-react";
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
import { cn, formatBytes } from "@/lib/utils";

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
          className="check mt-0.5"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label htmlFor={id} className="text-sm leading-snug text-fg">
          {label}
        </label>
      </span>
      {hint ? <p className="hint mt-1 pl-7">{hint}</p> : null}
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
        className="range mt-3"
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
                selected ? "bg-accent text-on-accent" : "text-muted hover:text-fg",
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
      {state === "done" ? "Copied" : (children ?? label)}
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
  error,
  busy = false,
  selected,
  onClear,
}: {
  onFile: (files: File[]) => void;
  accept?: string;
  /** Also used as the accessible name of the hidden file input. */
  label: string;
  hint?: ReactNode;
  multiple?: boolean;
  className?: string;
  /** Shown under the zone when a file was rejected or the tool cannot read it. */
  error?: ReactNode;
  /** A visible processing state: the tool is reading the file it was handed. */
  busy?: boolean;
  /**
   * The file the tool is now holding. When supplied, the zone steps back and the
   * name, size and a Remove action take its place — so the control always says
   * what it currently has, not just what it accepts.
   */
  selected?: { name: string; size?: number } | null;
  /** Clears the held file. Rendered only alongside `selected`. */
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // A depth counter keeps the drag state correct as the pointer crosses the
  // child elements of the drop area.
  const dragDepth = useRef(0);

  const acceptsImage = Boolean(accept?.includes("image"));

  // Keep the paste listener subscribed once, reading the latest props from a ref
  // so an inline onFile never re-registers the listener on every render.
  const configRef = useRef({ onFile, multiple });
  useEffect(() => {
    configRef.current = { onFile, multiple };
  });

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length === 0) return;
      event.preventDefault();
      configRef.current.onFile(files.slice(0, configRef.current.multiple ? undefined : 1));
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // The held-file state is a different control, not a variant of the zone. Every
  // hook above still runs first, so the branch is safe.
  if (selected) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-3.5 py-3">
          <span className="icon-tile icon-tile-sm">
            <Upload className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">{selected.name}</span>
            {typeof selected.size === "number" ? (
              <span className="num block text-xs text-muted">{formatBytes(selected.size)}</span>
            ) : null}
          </span>
          {busy ? (
            <span className="text-xs text-muted" role="status" aria-live="polite">
              Working…
            </span>
          ) : onClear ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
              Remove
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-xs text-highlight-text">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFile(Array.from(list));
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-busy={busy || undefined}
        onClick={() => {
          if (busy) return;
          inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={onDrop}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-8 text-center transition-colors duration-150 ease-out",
          dragging
            ? "border-accent bg-surface-3"
            : "border-line-strong bg-surface-2 hover:border-accent hover:bg-surface-3",
          busy && "cursor-progress",
        )}
      >
        <span className="icon-tile icon-tile-md">
          <Upload className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-fg">{label}</span>
        <span className="btn btn-secondary btn-sm pointer-events-none" aria-hidden="true">
          {busy ? "Working…" : `Choose file${multiple ? "s" : ""}`}
        </span>
        {acceptsImage ? <span className="text-xs text-muted">Or paste from the clipboard.</span> : null}
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-highlight-text">
          {error}
        </p>
      ) : null}
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
  );
}

/* ---------------------------------------------------------------- file list */

export interface FileListItem {
  id: string;
  name: string;
  /** A short line under the name — page count, dimensions, size. */
  meta?: ReactNode;
}

/**
 * An ordered list of the files a tool is holding, with move-up, move-down and
 * remove controls.
 *
 * The order is changed with buttons rather than by dragging: a drag handle is
 * invisible to a keyboard and awkward on a phone, and every tool that offers
 * reordering needs to stay usable without a pointer. The buttons disable at the
 * ends so the list never offers a move that would do nothing.
 */
export function FileList({
  items,
  onMove,
  onRemove,
  label,
  disabled,
}: {
  items: FileListItem[];
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-1.5" aria-label={label}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-md border border-line bg-surface-2 py-1.5 pl-3.5 pr-1.5"
        >
          <span className="num w-5 shrink-0 text-sm font-semibold text-muted" aria-hidden="true">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg" title={item.name}>
              {item.name}
            </span>
            {item.meta ? <span className="block truncate text-xs text-muted">{item.meta}</span> : null}
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="btn btn-ghost px-2.5"
              onClick={() => onMove(item.id, -1)}
              disabled={disabled || index === 0}
              aria-label={`Move ${item.name} up`}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-ghost px-2.5"
              onClick={() => onMove(item.id, 1)}
              disabled={disabled || index === items.length - 1}
              aria-label={`Move ${item.name} down`}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-ghost px-2.5"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              aria-label={`Remove ${item.name}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ states */

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- an object URL is a browser resource owned by this effect: it must be created after mount and revoked on cleanup, so the URL cannot be derived during render
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return url;
}

/* --------------------------------------------------------------- shortcuts */

export interface Shortcut {
  keys: string;
  action: string;
}

/**
 * A “?” popover listing the keys that work on this page. It is a native
 * `<details>`, so it opens on click, Enter or Space with no script, stays inside
 * the tab order, and closes on a second activation. The trigger carries no text,
 * so it is labelled for a screen reader instead.
 */
export function Shortcuts({
  items,
  label = "Keyboard shortcuts",
  className,
}: {
  items: Shortcut[];
  label?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <details className={cn("shortcuts", className)}>
      <summary className="shortcuts-trigger" aria-label={label} title={label}>
        ?
      </summary>
      <div className="shortcuts-panel">
        <p className="label mb-0">{label}</p>
        <dl className="mt-2.5 flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.keys} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted">{item.action}</dt>
              <dd>
                <kbd className="kbd">{item.keys}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}
