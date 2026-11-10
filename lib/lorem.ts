import { randomInt } from "@/lib/random";

/**
 * The classic lorem ipsum word bank plus a small generator. Randomness is drawn
 * from the browser's cryptographic source, and this is only ever called from
 * event handlers or effects — never during render.
 */

const WORDS = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud
exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure
in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur
sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim
id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio
vivamus elementum semper nisi aenean vulputate eleifend tellus leo ligula
porttitor eu consequat vitae eleifend ac enim aliquam lorem ante dapibus in
viverra quis feugiat a tellus phasellus viverra nulla ut metus varius laoreet`
  .split(/\s+/)
  .filter(Boolean);

const OPENING = ["Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit"];

export type LoremUnit = "paragraphs" | "sentences" | "words";

function sentence(minWords = 6, maxWords = 14): string {
  const length = minWords + randomInt(maxWords - minWords + 1);
  const words: string[] = [];
  for (let i = 0; i < length; i += 1) words.push(WORDS[randomInt(WORDS.length)]);
  return words.join(" ");
}

function paragraph(): string {
  const count = 3 + randomInt(3);
  return Array.from({ length: count }, () => sentence()).join(". ") + ".";
}

export function generateLorem(unit: LoremUnit, count: number, startTraditional: boolean): string {
  const safeCount = Math.min(Math.max(1, Math.floor(count) || 1), 200);
  const opening = OPENING.join(" ");

  if (unit === "paragraphs") {
    const paragraphs = Array.from({ length: safeCount }, () => paragraph());
    if (startTraditional) paragraphs[0] = opening + paragraphs[0].replace(/^[^.]*/, "");
    return paragraphs.join("\n\n");
  }

  if (unit === "sentences") {
    const sentences = Array.from({ length: safeCount }, () => sentence());
    const text = sentences.join(". ") + ".";
    return startTraditional ? text.replace(/^[^.]+/, opening) : text;
  }

  const words = Array.from({ length: safeCount }, () => WORDS[randomInt(WORDS.length)]);
  const joined = words.join(" ") + ".";
  return startTraditional ? `${opening} ${joined}` : joined;
}
