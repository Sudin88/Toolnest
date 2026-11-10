import type { SearchEntry } from "@/lib/search-index";

/**
 * Ranking shared by the header palette and the hero search box, so both rank
 * identically. Names beat taglines beat keywords, and all terms must match.
 */
export function rankEntries(entries: SearchEntry[], rawQuery: string, limit = 8): SearchEntry[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return entries.slice(0, limit);

  const terms = query.split(/\s+/);
  const scored: { entry: SearchEntry; score: number }[] = [];

  for (const entry of entries) {
    const name = entry.name.toLowerCase();
    const tagline = entry.tagline.toLowerCase();
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      if (name.startsWith(term)) score += 50;
      else if (name.includes(term)) score += 30;
      else if (tagline.includes(term)) score += 10;
      else if (entry.haystack.includes(term)) score += 5;
      else {
        matchedAll = false;
        break;
      }
    }

    if (matchedAll && score > 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return scored.slice(0, limit).map((item) => item.entry);
}
