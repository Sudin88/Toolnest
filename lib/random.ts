/**
 * Unbiased randomness. `crypto.getRandomValues` returns uniform 32-bit integers,
 * but a plain `% n` introduces a small bias toward low values. Rejection sampling
 * throws away the uneven tail instead, which is what a draw should do.
 */

const UINT32_RANGE = 0x1_0000_0000;
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

/** One uniform 32-bit word. */
function nextUint32(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}

/**
 * A uniform integer in [0, range) built from two words (53 bits), for ranges
 * wider than a single 32-bit draw. Rejection sampling keeps it unbiased.
 */
function random53(range: number): number {
  const limit = Math.floor(MAX_SAFE / range) * range;
  const buffer = new Uint32Array(2);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] * 0x20_0000 + (buffer[1] >>> 11);
  } while (value >= limit);
  return value % range;
}

export function randomInt(maxExclusive: number): number {
  // A range that is not a positive finite number, or one single value, needs no
  // draw. Catching it here is what stops `Math.floor(RANGE / n) * n` from
  // rounding to zero and making the rejection loop below spin forever.
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 1) return 0;
  if (maxExclusive > MAX_SAFE) return random53(MAX_SAFE);
  if (maxExclusive > UINT32_RANGE) return random53(maxExclusive);

  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  let value = 0;
  do {
    value = nextUint32();
  } while (value >= limit);
  return value % maxExclusive;
}

/** Inclusive on both ends. */
export function randomIntInclusive(min: number, max: number): number {
  if (max < min) return min;
  return min + randomInt(max - min + 1);
}

/** A decimal in [min, max] with the requested number of decimal places. */
export function randomDecimal(min: number, max: number, decimals: number): number {
  // The number of places is bounded, so an extreme request cannot make the scale
  // overflow into an unusable span.
  const places = Math.min(12, Math.max(0, Math.floor(decimals)));
  const scale = 10 ** places;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = Math.round((hi - lo) * scale);
  if (!Number.isFinite(span) || span <= 0) return lo;
  const steps = randomInt(span + 1);
  return Math.round((lo + steps / scale) * scale) / scale;
}
