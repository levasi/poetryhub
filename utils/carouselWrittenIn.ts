/**
 * Carousel cover “Written in …” line: DB stores either {@link Poem.writtenYear} (integer)
 * or free text in {@link Poem.writtenPeriod}. Preview must not use `parseInt` on phrases
 * like “9 aprilie 19” (that would truncate to 9).
 */

/** True when the whole trimmed value is only digits and a valid catalog year (1–3000). */
export function parseStrictPoemWrittenYear(s: string): number | null {
  const t = s.trim()
  if (!t || !/^\d{1,4}$/.test(t)) return null
  const n = Number.parseInt(t, 10)
  if (!Number.isFinite(n) || n < 1 || n > 3000) return null
  return n
}
