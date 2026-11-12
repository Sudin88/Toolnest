/**
 * The payload half of the QR code generator, kept out of the component so the
 * escaping rules and the link-scheme guard are pure and can be reasoned about
 * (and unit-tested) without a canvas.
 *
 * The guard is the interesting part: a scanned code is acted on by a third-party
 * app, so a `javascript:` or `data:` URL must never be handed over as a link.
 * Anything whose scheme is not on the allowlist is encoded as literal text
 * instead, which the component surfaces to the visitor.
 */

export type QrMode = "link" | "text" | "wifi" | "contact";
export type QrLevel = "L" | "M" | "Q" | "H";

export const QR_MODES: { value: QrMode; label: string }[] = [
  { value: "link", label: "Website link" },
  { value: "text", label: "Plain text" },
  { value: "wifi", label: "Wi-Fi network" },
  { value: "contact", label: "Contact card" },
];

/** Schemes a scanned link is allowed to use. Anything else is encoded as text. */
export const LINK_SCHEMES = ["http:", "https:", "mailto:", "tel:"];
/** Above this, the encoder is not called at all; the widest QR is ~3,000 chars. */
export const MAX_QR_CHARS = 2_000;

/** Wi-Fi payloads escape these five characters with a backslash. */
export function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** vCard values escape backslash, comma, semicolon and newlines. */
export function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([;,])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

export interface QrWifi {
  ssid: string;
  password: string;
  encryption: string;
  hidden: boolean;
}

export interface QrContact {
  name: string;
  org: string;
  phone: string;
  email: string;
  website: string;
}

export interface QrFields {
  link: string;
  text: string;
  wifi: QrWifi;
  contact: QrContact;
}

export interface QrContent {
  /** The payload to encode. Empty when the form is not yet complete. */
  value: string;
  /** True when a link's scheme was refused and the payload falls back to text. */
  blocked: boolean;
}

/**
 * A link is only handed off when its scheme is one a scanner should act on. A
 * `javascript:` or `data:` URL is encoded as literal text instead, so the code
 * cannot point a third-party scanner at an executable payload. A bare domain is
 * given an `https://` prefix so the scan opens correctly.
 */
export function qrLinkInfo(url: string): { value: string; blocked: boolean } {
  const trimmed = url.trim();
  if (!trimmed) return { value: "", blocked: false };
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    try {
      if (LINK_SCHEMES.includes(new URL(trimmed).protocol)) return { value: trimmed, blocked: false };
    } catch {
      // Not a parseable URL — encode it literally, below.
    }
    return { value: trimmed, blocked: true };
  }
  return { value: `https://${trimmed}`, blocked: false };
}

export function wifiPayload({ ssid, password, encryption, hidden }: QrWifi): string {
  if (!ssid.trim()) return "";
  const auth = encryption === "nopass" ? "nopass" : encryption;
  const secret = encryption === "nopass" ? "" : `P:${escapeWifi(password)};`;
  return `WIFI:T:${auth};S:${escapeWifi(ssid)};${secret}${hidden ? "H:true;" : ""};`;
}

export function vCardPayload(contact: QrContact): string {
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
}

/** The full payload for the chosen mode. */
export function qrContent(mode: QrMode, fields: QrFields): QrContent {
  if (mode === "link") return qrLinkInfo(fields.link);
  if (mode === "text") return { value: fields.text, blocked: false };
  if (mode === "wifi") return { value: wifiPayload(fields.wifi), blocked: false };
  return { value: vCardPayload(fields.contact), blocked: false };
}
