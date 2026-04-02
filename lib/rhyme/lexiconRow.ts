import { computeEndingKeys, splitSyllables, syllableCount } from './syllableParser'

const WORD_RE = /^[\p{L}]+$/u

/** Build DB fields from a surface form (IPA-dict, hunspell, etc.). */
export function wordToLexiconFields(word: string): {
  word: string
  baseForm: string
  type: string
  syllables: string
  syllableCount: number
  endingKey: string
  endingLast: string
} | null {
  const w = word.trim().toLowerCase()
  if (w.length < 2) return null
  if (w.includes('-')) return null
  if (!WORD_RE.test(w)) return null

  const parts = splitSyllables(w)
  const syllables = parts.join('|')
  const { endingKey, endingLast } = computeEndingKeys(w)

  return {
    word: w,
    baseForm: w,
    type: 'other',
    syllables,
    syllableCount: syllableCount(w),
    endingKey,
    endingLast,
  }
}
