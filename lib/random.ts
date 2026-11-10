/**
 * Unbiased randomness. `crypto.getRandomValues` returns uniform 32-bit integers,
 * but a plain `% n` introduces a small bias toward low values. Rejection sampling
 * throws away the uneven tail instead, which is what a draw should do.
 */

const UINT32_RANGE = 0x1_0000_0000;

export function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % maxExclusive;
}

/** Inclusive on both ends. */
export function randomIntInclusive(min: number, max: number): number {
  if (max < min) return min;
  return min + randomInt(max - min + 1);
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

/** A decimal in [min, max) with the requested number of decimal places. */
export function randomDecimal(min: number, max: number, decimals: number): number {
  const scale = 10 ** decimals;
  const span = Math.round((max - min) * scale);
  const steps = randomInt(span + 1);
  return Math.round((min + steps / scale) * scale) / scale;
}
