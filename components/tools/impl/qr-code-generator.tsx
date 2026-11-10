"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { Check, CopyButton, NumberInput, Select, TextInput } from "@/components/tools/interactive";
import { Note, OutputBox, SubHeading } from "@/components/tools/parts";
import { downloadBlob } from "@/lib/download";

type Mode = "link" | "text" | "wifi" | "contact";
type Level = "L" | "M" | "Q" | "H";

const MODES: { value: Mode; label: string }[] = [
  { value: "link", label: "Website link" },
  { value: "text", label: "Plain text" },
  { value: "wifi", label: "Wi-Fi network" },
  { value: "contact", label: "Contact card" },
];

/** Wi-Fi payloads escape these five characters with a backslash. */
function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** vCard values escape backslash, comma, semicolon and newlines. */
function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([;,])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

export default function QrCodeGenerator() {
  const [mode, setMode] = useState<Mode>("link");
  const [url, setUrl] = useState("https://toolnest.example.com");
  const [text, setText] = useState("Hello from ToolNest");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [contact, setContact] = useState({ name: "", org: "", phone: "", email: "", website: "" });
  const [size, setSize] = useState<number | "">(320);
  const [margin, setMargin] = useState<number | "">(4);
  const [level, setLevel] = useState<Level>("M");
  const [fg, setFg] = useState("#0b0a12");
  const [bg, setBg] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  // A failure belongs to the payload that produced it, so a stale message is
  // derived away on the next render instead of being cleared inside an effect.
  const [failure, setFailure] = useState<{ payload: string; message: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload = (() => {
    if (mode === "link") {
      const trimmed = url.trim();
      if (!trimmed) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    }
    if (mode === "text") return text;
    if (mode === "wifi") {
      if (!ssid.trim()) return "";
      const auth = encryption === "nopass" ? "nopass" : encryption;
      const secret = encryption === "nopass" ? "" : `P:${escapeWifi(password)};`;
      return `WIFI:T:${auth};S:${escapeWifi(ssid)};${secret}${hidden ? "H:true;" : ""};`;
    }
    if (!contact.name.trim() && !contact.phone.trim() && !contact.email.trim()) return "";
    const [first, ...rest] = contact.name.trim().split(/\s+/);
    const last = rest.join(" ");
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVCard(last)};${escapeVCard(first ?? "")};;;`,
      `FN:${escapeVCard(contact.name.trim())}`,
      contact.org.trim() ? `ORG:${escapeVCard(contact.org.trim())}` : "",
      contact.phone.trim() ? `TEL;TYPE=CELL:${escapeVCard(contact.phone.trim())}` : "",
      contact.email.trim() ? `EMAIL:${escapeVCard(contact.email.trim())}` : "",
      contact.website.trim() ? `URL:${escapeVCard(contact.website.trim())}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\n");
  })();

  const error = failure && failure.payload === payload ? failure.message : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!payload) {
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
        if (!cancelled) setFailure(null);
      })
      .catch(() => {
        if (!cancelled) {
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
  }, [payload, size, margin, level, fg, bg, transparent]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas || !payload || error) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    downloadBlob(blob, "qr-code.png");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <span className="label">What are you encoding?</span>
          <div role="group" aria-label="Content type" className="inline-flex flex-wrap gap-1 rounded-md border border-line bg-surface-2 p-1">
            {MODES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={mode === item.value}
                onClick={() => setMode(item.value)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out ${
                  mode === item.value ? "bg-accent text-on-accent" : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "link" ? (
          <TextInput
            label="Link"
            value={url}
            onChange={setUrl}
            inputMode="url"
            placeholder="example.com/page"
            hint="A bare domain is given an https:// prefix so the scan opens correctly."
          />
        ) : null}

        {mode === "text" ? (
          <TextInput label="Text" value={text} onChange={setText} />
        ) : null}

        {mode === "wifi" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="Network name (SSID)" value={ssid} onChange={setSsid} placeholder="HomeWifi" />
            <Select
              label="Security"
              value={encryption}
              onChange={setEncryption}
              options={[
                { value: "WPA", label: "WPA / WPA2 / WPA3" },
                { value: "WEP", label: "WEP (legacy)" },
                { value: "nopass", label: "Open, no password" },
              ]}
            />
            {encryption !== "nopass" ? (
              <TextInput label="Password" value={password} onChange={setPassword} className="sm:col-span-2" />
            ) : null}
            <Check
              label="This network is hidden"
              checked={hidden}
              onChange={setHidden}
              hint="Adds the hidden flag so phones ask for the SSID explicitly."
            />
          </div>
        ) : null}

        {mode === "contact" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="Full name" value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} placeholder="Ada Lovelace" />
            <TextInput label="Organisation" value={contact.org} onChange={(v) => setContact({ ...contact, org: v })} placeholder="Optional" />
            <TextInput label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} inputMode="text" placeholder="+1 555 0100" />
            <TextInput label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} inputMode="text" placeholder="ada@example.com" />
            <TextInput label="Website" value={contact.website} onChange={(v) => setContact({ ...contact, website: v })} inputMode="url" placeholder="Optional" />
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
          <legend className="sr-only">Appearance</legend>
          <SubHeading>Appearance</SubHeading>
          <div className="grid gap-5 sm:grid-cols-3">
            <NumberInput label="Size (px)" value={size} onChange={setSize} min={96} max={1024} step={16} />
            <NumberInput
              label="Margin (modules)"
              value={margin}
              onChange={setMargin}
              min={0}
              max={8}
              hint="The quiet zone scanners need."
            />
            <Select
              label="Error correction"
              value={level}
              onChange={(next) => setLevel(next as Level)}
              options={[
                { value: "L", label: "Low (7%)" },
                { value: "M", label: "Medium (15%) — recommended" },
                { value: "Q", label: "Quartile (25%)" },
                { value: "H", label: "High (30%)" },
              ]}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="qr-fg">Foreground</label>
              <input
                id="qr-fg"
                type="color"
                value={fg}
                onChange={(event) => setFg(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface-2 p-1"
              />
            </div>
            <div>
              <label className="label" htmlFor="qr-bg">Background</label>
              <input
                id="qr-bg"
                type="color"
                value={bg}
                onChange={(event) => setBg(event.target.value)}
                disabled={transparent}
                className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface-2 p-1 disabled:opacity-50"
              />
            </div>
          </div>
          <Check
            label="Transparent background"
            checked={transparent}
            onChange={setTransparent}
            hint="Useful over light artwork. Keep a light background in the layout itself, or the scanner may not find the code."
          />
        </fieldset>

        {payload ? (
          <div>
            <SubHeading id="qr-payload">What the code contains</SubHeading>
            <OutputBox className="mt-3 max-h-40">{payload}</OutputBox>
          </div>
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
            disabled={!payload || Boolean(error)}
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
