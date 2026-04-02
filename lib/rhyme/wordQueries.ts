import type Fuse from 'fuse.js'
import type { WordRecord } from './types'
import { foldDiacritics, normalizeWord, normForSearch } from './normalize'
import { splitSyllables } from './syllableParser'

export type SearchMode = 'fuzzy' | 'starts' | 'ends' | 'contains' | 'anagram' | 'exact'

export interface WordSearchOptions {
  /**
   * Dacă true, „mar” nu potrivește „măr” (compară doar lowercase, fără pliere diacritice).
   * Implicit false (comportament vechi: pliere pentru potrivire largă).
   */
  strictDiacritics?: boolean
  /** Dacă false, căutarea e doar subșir pe întregul text (fără OR pe silabe). Implicit true. */
  containsUseSyllables?: boolean
  /** Silabe folosite la OR; dacă lipsește sau e gol, se folosește `splitSyllables(needle)`. */
  containsSyllablesOverride?: string[] | null
}

/** Separatori acceptați în câmpul manual de silabe (ex: „a · b · c”). */
export function parseSyllableInput(text: string): string[] {
  return text
    .split(/[,\s·|]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function lettersOnly(s: string): string {
  return foldDiacritics(s.toLowerCase()).replace(/[^a-z]/g, '')
}

export function anagramKey(s: string): string {
  return lettersOnly(s).split('').sort().join('')
}

/** Litere pentru anagramă păstrând diacriticele (comparare strictă). */
function lettersOnlyStrict(s: string): string {
  return Array.from(s.toLowerCase().normalize('NFC'))
    .filter((ch) => /\p{L}/u.test(ch))
    .join('')
}

function anagramKeyStrict(s: string): string {
  return lettersOnlyStrict(s).split('').sort().join('')
}

/** Best index of any matcher in folded word (for OR „Conține” cu mai multe părți). */
function minSubstringIndex(fw: string, matchers: string[]): number {
  let min = Infinity
  for (const m of matchers) {
    if (m.length === 0) continue
    const i = fw.indexOf(m)
    if (i !== -1) min = Math.min(min, i)
  }
  return min === Infinity ? 999_999 : min
}

/** Rezultatele „Conține” nu sunt ordonate în corpus: sortăm după relevanță înainte de limită. */
function sortContainsMatches(
  rows: WordRecord[],
  matchers: string[],
  strictDiacritics: boolean
): WordRecord[] {
  if (rows.length <= 1) return rows
  return [...rows].sort((a, b) => {
    const fa = normForSearch(a.word, strictDiacritics)
    const fb = normForSearch(b.word, strictDiacritics)
    const ia = minSubstringIndex(fa, matchers)
    const ib = minSubstringIndex(fb, matchers)
    if (ia !== ib) return ia - ib
    if (fa.length !== fb.length) return fa.length - fb.length
    return fa.localeCompare(fb, 'ro')
  })
}

export function queryCorpus(
  corpus: WordRecord[],
  getFuse: () => Fuse<WordRecord> | null,
  mode: SearchMode,
  q: string,
  limit: number,
  options?: WordSearchOptions
): WordRecord[] {
  const needle = normalizeWord(q)
  const lim = Math.min(5000, Math.max(1, limit))
  const strict = options?.strictDiacritics === true
  const norm = (s: string) => normForSearch(s, strict)
  const needleNorm = norm(needle)

  if (mode === 'fuzzy') {
    if (!needle) return corpus.slice(0, lim)
    const fuse = getFuse()
    if (!fuse) return corpus.slice(0, lim)
    const hits = fuse.search(needle, { limit: lim }).map((r) => r.item)
    if (strict) {
      const n = needle.toLowerCase()
      return hits.filter((w) => w.word.toLowerCase().includes(n)).slice(0, lim)
    }
    return hits
  }

  const lowNeedle = needle.toLowerCase()

  const matchWord = (w: string) => {
    const nw = norm(w)
    switch (mode) {
      case 'exact':
        return nw === needleNorm
      case 'starts':
        return needle.length === 0 ? true : nw.startsWith(needleNorm)
      case 'ends':
        return needle.length === 0 ? true : nw.endsWith(needleNorm)
      default:
        return false
    }
  }

  if (mode === 'exact') {
    const direct = corpus.filter((w) => w.word.toLowerCase() === lowNeedle)
    if (direct.length) return direct
    if (strict) return []
    const fuse = getFuse()
    if (!fuse) return corpus.slice(0, lim)
    return fuse.search(needle, { limit: lim }).map((r) => r.item)
  }

  if (mode === 'anagram') {
    const sig = strict ? anagramKeyStrict(needle) : anagramKey(needle)
    if (!sig.length) return corpus.slice(0, lim)
    return corpus
      .filter((w) => {
        if (w.word.toLowerCase() === lowNeedle) return false
        const wSig = strict ? anagramKeyStrict(w.word) : anagramKey(w.word)
        return wSig === sig
      })
      .slice(0, lim)
  }

  /**
   * Conține: opțional OR pe silabe (≥2 caractere) + întregul text pliat; altfel doar subșir.
   */
  if (mode === 'contains') {
    if (!needle) return corpus.slice(0, lim)
    const useSyllables = options?.containsUseSyllables !== false
    if (!useSyllables) {
      const matchers = [needleNorm]
      const filtered = corpus.filter((w) => norm(w.word).includes(needleNorm))
      return sortContainsMatches(filtered, matchers, strict).slice(0, lim)
    }
    const rawOverride = options?.containsSyllablesOverride
    const syllables =
      rawOverride && rawOverride.length > 0 ? rawOverride : splitSyllables(needle)
    if (syllables.length < 2) {
      const matchers = [needleNorm]
      const filtered = corpus.filter((w) => norm(w.word).includes(needleNorm))
      return sortContainsMatches(filtered, matchers, strict).slice(0, lim)
    }
    const parts = syllables
      .map((s) => norm(s))
      .filter((s) => s.length >= 2)
    const matchers = [...new Set([...parts, needleNorm])].filter((m) => m.length > 0)
    const filtered = corpus.filter((w) => {
      const nw = norm(w.word)
      return matchers.some((m) => nw.includes(m))
    })
    return sortContainsMatches(filtered, matchers, strict).slice(0, lim)
  }

  if (mode === 'starts' || mode === 'ends') {
    if (!needle) return corpus.slice(0, lim)
    return corpus.filter((w) => matchWord(w.word)).slice(0, lim)
  }

  return corpus.slice(0, lim)
}
