export const MIN_SEARCH_LETTERS = 2

export const RO_DIACRITICS = ['ă', 'â', 'î', 'ș', 'ț'] as const

export function letterCount(s: string): number {
  return [...s.normalize('NFC')].filter((ch) => /\p{L}/u.test(ch)).length
}

export function nonEmptySearchTerms(rows: { text: string }[]): string[] {
  return rows.map((r) => r.text.trim()).filter(Boolean)
}

/** Terms with at least {@link MIN_SEARCH_LETTERS} letters — avoids noisy single-letter lookups. */
export function searchableTerms(rows: { text: string }[]): string[] {
  return nonEmptySearchTerms(rows).filter((term) => letterCount(term) >= MIN_SEARCH_LETTERS)
}

export function canSearch(rows: { text: string }[]): boolean {
  return searchableTerms(rows).length > 0
}
