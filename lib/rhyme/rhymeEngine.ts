import type { RhymeFilters, RhymeKind, RhymeMatch, WordRecord } from './types'
import { computeEndingKeys, syllableCount } from './syllableParser'
import { foldDiacritics, normalizeWord } from './normalize'

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const row = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) row[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = row[0]!
    row[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]!
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost)
      prev = tmp
    }
  }
  return row[n]!
}

/** Longest common suffix length (characters match from the end). */
function commonSuffixLength(a: string, b: string): number {
  let n = 0
  const lim = Math.min(a.length, b.length)
  while (n < lim && a[a.length - 1 - n] === b[b.length - 1 - n]) n++
  return n
}

/**
 * True if the two ending keys align well enough to be considered a rhyme.
 * Short last syllables (e.g. "ri" vs "re") must NOT match unless the full
 * ending cluster (last 2 syllables) also shares a long enough suffix.
 */
function endingKeysRhyme(ek: string, ck: string): boolean {
  const a = foldDiacritics(ek)
  const b = foldDiacritics(ck)
  if (!a.length || !b.length) return false
  const suf = commonSuffixLength(a, b)
  const minLen = Math.min(a.length, b.length)
  /** Need at least 3 graphemes shared at the rhyme nucleus, or full shorter key */
  if (suf >= 3) return true
  if (minLen <= 3) return a === b
  /** Longer words: require ≥4 chars matching at suffix for partial overlap */
  return suf >= 4
}

function classifyRhyme(
  targetKey: string,
  targetLast: string,
  candKey: string,
  candLast: string,
  filters: RhymeFilters
): { kind: RhymeKind; score: number } | null {
  const ek = foldDiacritics(targetKey)
  const ck = foldDiacritics(candKey)
  const el = foldDiacritics(targetLast)
  const cl = foldDiacritics(candLast)

  if (ck === ek && cl === el) {
    return { kind: 'exact', score: 100 }
  }
  if (ck === ek) {
    return { kind: 'exact', score: 92 }
  }
  /**
   * Same last syllable (e.g. ...re) is not enough: "mare" vs "iubire" share "re" but do not rhyme.
   * Require the full ending cluster to align (suffix / nucleus), not only the last syllable string.
   */
  if (cl === el && endingKeysRhyme(ek, ck)) {
    return { kind: 'exact', score: 92 }
  }

  /** Near / loose must agree on ending cluster — never rely on tiny last syllables alone */
  if (!endingKeysRhyme(ek, ck)) {
    return null
  }

  const distKey = levenshtein(ck, ek)

  if (distKey <= 1) {
    return { kind: 'near', score: 78 - distKey * 6 }
  }
  if (distKey === 2 && commonSuffixLength(ek, ck) >= 3) {
    return { kind: 'near', score: 62 }
  }

  if (filters.rhymeType !== 'both') {
    return null
  }

  if (distKey <= 3 && commonSuffixLength(ek, ck) >= 3) {
    return { kind: 'loose', score: 42 - distKey * 3 }
  }

  return null
}

/**
 * Rank rhyme candidates from an in-memory corpus.
 */
export function getRhymes(
  rawWord: string,
  corpus: WordRecord[],
  filters: RhymeFilters
): RhymeMatch[] {
  const needle = normalizeWord(rawWord)
  if (!needle) return []

  const dict = new Map(corpus.map((w) => [w.word.toLowerCase(), w]))
  const known = dict.get(needle)
  const { endingKey: ek, endingLast: el } = known
    ? { endingKey: known.endingKey, endingLast: known.endingLast }
    : computeEndingKeys(needle)

  const out: RhymeMatch[] = []

  for (const w of corpus) {
    if (w.word.toLowerCase() === needle) continue

    const cls = classifyRhyme(ek, el, w.endingKey, w.endingLast, filters)
    if (!cls) continue

    if (filters.rhymeType === 'exact' && cls.kind !== 'exact') continue
    if (filters.rhymeType === 'near' && cls.kind === 'loose') continue

    const sc = syllableCount(w.word)
    if (sc < filters.minSyllables || sc > filters.maxSyllables) continue
    if (filters.wordType !== 'any' && w.type !== filters.wordType) continue
    if (w.word.length > filters.maxLength) continue

    let score = cls.score
    if (Math.abs(sc - syllableCount(needle)) <= 1) score += 5

    out.push({
      ...w,
      score,
      rhymeKind: cls.kind,
    })
  }

  out.sort((a, b) => b.score - a.score)
  return out.slice(0, filters.limit)
}
