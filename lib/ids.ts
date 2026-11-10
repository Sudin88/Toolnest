import { randomInt } from "@/lib/random";

/**
 * UUIDs (RFC 9562) and passwords, both generated from the browser's
 * cryptographically secure random source.
 */

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

function formatUuid(bytes: Uint8Array): string {
  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  return formatUuid(bytes);
}

export function uuidV7(now = Date.now()): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const byteAt = (shift: number) => Math.floor(now / 2 ** shift) % 256;
  bytes[0] = byteAt(40);
  bytes[1] = byteAt(32);
  bytes[2] = byteAt(24);
  bytes[3] = byteAt(16);
  bytes[4] = byteAt(8);
  bytes[5] = byteAt(0);

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  return formatUuid(bytes);
}

export type UuidVersion = "v4" | "v7";

export interface UuidOptions {
  version: UuidVersion;
  count: number;
  uppercase: boolean;
  hyphens: boolean;
}

export function generateUuids({ version, count, uppercase, hyphens }: UuidOptions): string[] {
  const total = Math.min(Math.max(Math.floor(count) || 1, 1), 1000);
  const make = version === "v7" ? uuidV7 : uuidV4;
  return Array.from({ length: total }, () => {
    let value = make();
    if (!hyphens) value = value.replace(/-/g, "");
    return uppercase ? value.toUpperCase() : value;
  });
}

/* -------------------------------------------------------------- passwords */

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
}

const SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

const AMBIGUOUS = /[lI1O0o]/g;

export function buildAlphabet(options: PasswordOptions): string {
  let pool = "";
  if (options.lowercase) pool += SETS.lowercase;
  if (options.uppercase) pool += SETS.uppercase;
  if (options.digits) pool += SETS.digits;
  if (options.symbols) pool += SETS.symbols;
  if (options.avoidAmbiguous) pool = pool.replace(AMBIGUOUS, "");
  return pool;
}

export function generatePassword(options: PasswordOptions): string {
  const length = Math.min(Math.max(Math.floor(options.length) || 1, 4), 128);

  const chosen: string[] = [];
  if (options.lowercase) chosen.push(SETS.lowercase);
  if (options.uppercase) chosen.push(SETS.uppercase);
  if (options.digits) chosen.push(SETS.digits);
  if (options.symbols) chosen.push(SETS.symbols);

  const pool = buildAlphabet(options);
  if (pool.length === 0 || chosen.length === 0) return "";

  const chars: string[] = chosen.map((set) => {
    const usable = options.avoidAmbiguous ? set.replace(AMBIGUOUS, "") : set;
    return usable[randomInt(usable.length)];
  });

  while (chars.length < length) chars.push(pool[randomInt(pool.length)]);

  // Fisher–Yates so the guaranteed characters are not stuck at the front.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.slice(0, length).join("");
}

export interface Strength {
  bits: number;
  label: "Weak" | "Fair" | "Strong" | "Very strong";
  tone: "weak" | "fair" | "strong" | "very-strong";
}

export function passwordStrength(options: PasswordOptions): Strength {
  const pool = buildAlphabet(options).length;
  const length = Math.max(0, Math.floor(options.length) || 0);
  const bits = pool > 1 ? Math.round(length * Math.log2(pool)) : 0;

  if (bits < 45) return { bits, label: "Weak", tone: "weak" };
  if (bits < 70) return { bits, label: "Fair", tone: "fair" };
  if (bits < 100) return { bits, label: "Strong", tone: "strong" };
  return { bits, label: "Very strong", tone: "very-strong" };
}
