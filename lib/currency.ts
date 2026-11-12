/**
 * Currency is presentation only — every calculator works on plain numbers and
 * formats them at the edge, so nothing here affects the arithmetic.
 */

export const CURRENCIES = [
  { value: "USD", label: "US dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "Pound sterling (£)" },
  { value: "INR", label: "Indian rupee (₹)" },
  { value: "AUD", label: "Australian dollar (A$)" },
  { value: "CAD", label: "Canadian dollar (C$)" },
] as const;

export function formatMoney(value: number, currency: string, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(value);
  } catch {
    // An unknown currency code makes `Intl` throw a RangeError. Money is
    // presentation only, so an unrecognised code shows a dash, not a crash.
    return "-";
  }
}
