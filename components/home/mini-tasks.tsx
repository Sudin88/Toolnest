"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { siteConfig } from "@/lib/site";
import { countWords, dedupeLines } from "@/lib/text";
import { formatNumber } from "@/lib/utils";

/**
 * “Do it now.” Three jobs a visitor can finish on the home page without opening
 * anything: count words, collapse a list, and make a QR code. Each one reuses
 * the real library the full tool uses — `lib/text` and the same `qrcode`
 * package — so there is no second implementation to drift. The “Open full tool”
 * link is the exit for anyone who needs the rest of the controls.
 */

export function MiniTasks() {
  return (
    <div className="mt-12 border-t border-line pt-8">
      <p className="eyebrow">Do it now</p>
      <h2 className="mt-2 text-xl font-bold leading-tight tracking-[-0.02em] text-fg">
        Three jobs you can finish right here
      </h2>
      <p className="measure mt-2 text-sm leading-relaxed text-muted">
        No page to open, no file to upload. Each card uses the same code as its full tool, so the
        answer you see here is the answer you would get there.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <CountWords />
        <CollapseList />
        <MakeQr />
      </div>
    </div>
  );
}

function MiniCard({
  title,
  blurb,
  href,
  children,
}: {
  title: string;
  blurb: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col p-4">
      <h3 className="text-[0.9375rem] font-bold text-fg">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{blurb}</p>
      <div className="mt-3 flex-1">{children}</div>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text no-underline hover:underline"
      >
        Open full tool
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function CountWords() {
  const [text, setText] = useState("");
  const words = countWords(text);

  return (
    <MiniCard title="Count words" blurb="Live word count as you type." href="/tools/word-counter">
      <textarea
        className="field field-mono"
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste a paragraph…"
        aria-label="Text to count"
      />
      <p className="mt-2 text-sm text-muted" role="status" aria-live="polite">
        <span className="num font-semibold text-fg">{formatNumber(words)}</span>{" "}
        {words === 1 ? "word" : "words"}
      </p>
    </MiniCard>
  );
}

function CollapseList() {
  const [text, setText] = useState("");
  const result = dedupeLines(text, { ignoreCase: true, trim: true, removeEmpty: true, sort: false });
  const removed = result.duplicates;

  return (
    <MiniCard
      title="Remove duplicate lines"
      blurb="Collapse a repeated list down to its unique lines."
      href="/tools/remove-duplicate-lines"
    >
      <textarea
        className="field field-mono"
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={"apple\nbanana\napple"}
        aria-label="List to clean"
      />
      <p className="mt-2 text-sm text-muted" role="status" aria-live="polite">
        {text.length === 0 ? (
          "Repeated lines are removed as you paste."
        ) : (
          <>
            <span className="num font-semibold text-fg">{formatNumber(result.kept)}</span> kept,{" "}
            <span className="num">{formatNumber(removed)}</span> removed
          </>
        )}
      </p>
    </MiniCard>
  );
}

function MakeQr() {
  const [text, setText] = useState(siteConfig.url);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const payload = text.trim();
    const context = canvas.getContext("2d");
    if (!payload) {
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Two savings in one: the encoder is imported on demand, so it is a separate
    // chunk rather than part of the home page's initial bundle, and the redraw is
    // debounced so typing does not re-encode on every character.
    let cancelled = false;
    const timer = setTimeout(() => {
      void import("qrcode")
        .then(({ default: QRCode }) => {
          if (cancelled) return;
          return QRCode.toCanvas(canvas, payload, { width: 132, margin: 2, errorCorrectionLevel: "M" });
        })
        .catch(() => {
          if (!cancelled) context?.clearRect(0, 0, canvas.width, canvas.height);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <MiniCard title="Make a QR code" blurb="For a link or a short line of text." href="/tools/qr-code-generator">
      <div className="flex items-center gap-4">
        <canvas
          ref={canvasRef}
          className="size-[132px] shrink-0 rounded-md border border-line bg-surface"
          aria-label="QR code preview"
          role="img"
        />
        <input
          type="text"
          className="field"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={200}
          placeholder="https://example.com"
          aria-label="Text or link to encode"
        />
      </div>
    </MiniCard>
  );
}
