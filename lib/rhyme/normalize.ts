/** Lowercase Romanian text; keep diacritics (rhyme quality depends on them). */
export function normalizeWord(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

const DIACRITIC_MAP: Record<string, string> = {
  ă: 'a',
  â: 'a',
  î: 'i',
  ș: 's',
  ş: 's',
  ț: 't',
  ţ: 't',
}

/** Fold diacritics for loose comparison / near-rhyme helpers. */
export function foldDiacritics(s: string): string {
  let out = ''
  for (const ch of s.toLowerCase()) {
    out += DIACRITIC_MAP[ch] ?? ch
  }
  return out
}

/**
 * Normalize for dictionary search: either strict (doar lowercase, păstrează diacriticele)
 * sau pliat (a ≈ ă etc.).
 */
export function normForSearch(s: string, strictDiacritics: boolean): string {
  const low = s.toLowerCase()
  return strictDiacritics ? low : foldDiacritics(low)
}
