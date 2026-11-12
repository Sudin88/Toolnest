"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { QrCodeForm, type QrFormState } from "@/components/tools/impl/qr-code-generator-form";
import { CopyButton } from "@/components/tools/interactive";
import { Note, OutputBox, SubHeading } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";
import { MAX_QR_CHARS, qrContent } from "@/lib/qr";
import { siteConfig } from "@/lib/site";
import { formatNumber } from "@/lib/utils";

export default function QrCodeGenerator() {
  const [form, setForm] = useState<QrFormState>({
    mode: "link",
    link: siteConfig.url,
    text: "Hello from ToolNest",
    wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
    contact: { name: "", org: "", phone: "", email: "", website: "" },
    size: 320,
    margin: 4,
    level: "M",
    fg: "#0b0a12",
    bg: "#ffffff",
    transparent: false,
  });
  // A failure belongs to the payload that produced it, so a stale message is
  // derived away on the next render instead of being cleared inside an effect.
  const [failure, setFailure] = useState<{ payload: string; message: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  function update(patch: Partial<QrFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  const { mode, size, margin, level, fg, bg, transparent } = form;

  // The payload and the link-scheme guard are pure: they live in `lib/qr` so the
  // escaping rules can be asserted without a canvas.
  const content = qrContent(mode, { link: form.link, text: form.text, wifi: form.wifi, contact: form.contact });
  const payload = content.value;
  const blockedScheme = content.blocked;

  const tooLong = payload.length > MAX_QR_CHARS;
  const error = tooLong
    ? `That content is longer than the ${formatNumber(MAX_QR_CHARS)}-character limit for one QR code. Shorten it to generate a code.`
    : failure && failure.payload === payload
      ? failure.message
      : null;

  // The canvas is drawn asynchronously, so a `rendered` key is set only once the
  // draw for the current content and settings has finished. Download is blocked
  // until it matches — otherwise a fast click right after a change could save
  // the previous code.
  const renderKey = [payload, size, margin, level, fg, bg, transparent].join("\u0000");
  const [rendered, setRendered] = useState<string | null>(null);

  // Nothing drawable is on the canvas, so forget the previous render during the
  // render pass — a stale key must never authorise a download of a canvas that
  // has been cleared. Adjusting state during render is React's reset pattern.
  if ((!payload || tooLong) && rendered !== null) setRendered(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Nothing to draw: clear the canvas.
    if (!payload || tooLong) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let cancelled = false;
    QRCode.toCanvas(canvas, payload, {
      width: typeof size === "number" && size > 0 ? Math.round(size) : 320,
      margin: typeof margin === "number" ? Math.min(Math.max(margin, 0), 8) : 4,
      errorCorrectionLevel: level,
      color: { dark: fg, light: transparent ? "#0000" : bg },
    })
      .then(() => {
        if (!cancelled) {
          setFailure(null);
          setRendered(renderKey);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRendered(null);
          setFailure({
            payload,
            message:
              "This content is too long for a QR code at the chosen error-correction level. Shorten it, or lower the level to L.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [renderKey, payload, tooLong, size, margin, level, fg, bg, transparent]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas || !payload || error || rendered !== renderKey) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    downloadBlob(blob, "qr-code.png");
  }

  const downloadable = Boolean(payload) && !error && rendered === renderKey;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="flex min-w-0 flex-col gap-6">
        <QrCodeForm value={form} onChange={update} />

        {payload ? (
          <div>
            <SubHeading id="qr-payload">What the code contains</SubHeading>
            <OutputBox className="mt-3 max-h-40">{payload}</OutputBox>
          </div>
        ) : null}

        {blockedScheme ? (
          <Note tone="warn">
            That link uses a scheme a QR scanner should not open, so it is encoded as plain text
            instead of a tappable link. Use an http, https, mailto or tel address for a link a scanner
            will follow.
          </Note>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="panel flex flex-col items-center gap-4 p-5">
          <canvas
            ref={canvasRef}
            className="h-auto w-full max-w-[20rem] rounded-md"
            aria-label="QR code preview"
            role="img"
          />
          {error ? (
            <p className="text-center text-sm text-highlight-text">{error}</p>
          ) : !payload ? (
            <p className="text-center text-sm text-muted">Fill in the content to generate a code.</p>
          ) : null}
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={download}
            disabled={!downloadable}
          >
            Download PNG
          </button>
          <CopyButton value={payload} label="Copy content" disabled={!payload} className="w-full justify-center" />
        </div>

        <Note>
          The code encodes your content directly rather than pointing at a redirect service, so it
          never expires and cannot be switched off. Leave the quiet-zone margin in place — scanners
          need that clear border.
        </Note>
      </div>
    </div>
  );
}
