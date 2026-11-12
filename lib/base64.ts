/**
 * UTF-8-correct base64. `btoa` only accepts Latin-1, so text is encoded to bytes
 * first; decoding reverses that. Both directions are validated rather than
 * producing mojibake.
 */

/** Above this the decode input is refused rather than allocated several times over. */
export const MAX_BASE64_CHARS = 4_000_000;

export function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);
  if (!urlSafe) return base64;
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type Base64DecodeResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export function decodeBase64(input: string, tolerant: boolean): Base64DecodeResult {
  let value = input.replace(/\s+/g, "");
  if (value.length === 0) return { ok: true, text: "" };

  // `atob` builds a full binary string, so an unbounded paste would allocate
  // several times the input before any validation ran. Refuse it up front.
  if (value.length > MAX_BASE64_CHARS) {
    return {
      ok: false,
      error: `That is longer than the ${MAX_BASE64_CHARS.toLocaleString("en-US")}-character limit for one decode. Split it into smaller pieces.`,
    };
  }

  // Normalise URL-safe output back to the standard alphabet.
  value = value.replace(/-/g, "+").replace(/_/g, "/");

  if (tolerant) {
    const remainder = value.length % 4;
    if (remainder === 2) value += "==";
    else if (remainder === 3) value += "=";
    else if (remainder === 1) {
      return { ok: false, error: "That is one character short of a valid base64 group." };
    }
  } else if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    return {
      ok: false,
      error:
        "That does not look like base64. It uses characters outside A–Z, a–z, 0–9, + and /, or its length is not a multiple of four. Padding-tolerant mode fixes the length.",
    };
  }

  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      error: "The string could not be decoded. Check that every character belongs to the base64 alphabet.",
    };
  }
}
