import { foldDiacritics, normalizeWord } from './normalize'

const VOWELS = new Set('aăâeioîou')

function isVowel(c: string): boolean {
  return VOWELS.has(c)
}

/**
 * Heuristic Romanian syllable split (MVP).
 * Splits into syllable-like chunks using vowel nuclei; good enough for endings / counts.
 */
export function splitSyllables(word: string): string[] {
  const w = normalizeWord(word).replace(/[^a-zăâîșşțţ]+/gi, '')
  if (!w.length) return []

  const chars = [...w]
  const syllables: string[] = []
  let current = ''

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]!
    current += c

    const next = chars[i + 1]
    const isV = isVowel(c)
    const nextIsV = next ? isVowel(next) : false

    if (isV && next && !nextIsV) {
      syllables.push(current)
      current = ''
    }
  }
  if (current) syllables.push(current)

  if (syllables.length === 0) return [w]
  return syllables
}

/** Last N syllables joined (lowercase). */
export function lastSyllableCluster(word: string, count: 2 | 3 = 2): string {
  const parts = splitSyllables(word)
  if (parts.length === 0) return ''
  const n = Math.min(count, parts.length)
  return parts.slice(-n).join('')
}

export function endingLastSyllable(word: string): string {
  const parts = splitSyllables(word)
  return parts.length ? parts[parts.length - 1]! : ''
}

export function syllableCount(word: string): number {
  return Math.max(1, splitSyllables(word).length)
}

/** Keys used by the rhyme engine (diacritic-folded for near matching). */
export function computeEndingKeys(word: string): { endingKey: string; endingLast: string } {
  const parts = splitSyllables(word)
  if (!parts.length) {
    const w = foldDiacritics(normalizeWord(word))
    return { endingKey: w.slice(-4), endingLast: w.slice(-1) }
  }
  const last = parts[parts.length - 1]!
  const last2 =
    parts.length >= 2 ? parts[parts.length - 2]! + last : last
  return {
    endingKey: foldDiacritics(last2),
    endingLast: foldDiacritics(last),
  }
}
