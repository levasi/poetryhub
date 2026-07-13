import Fuse from 'fuse.js'
import type { WordRecord } from '../../lib/rhyme/types'
import { normForSearch } from '../../lib/rhyme/normalize'
import { queryCorpus, sortWordRecordsByLength, type SearchMode, type WordSearchOptions } from '../../lib/rhyme/wordQueries'
import { prisma } from './prisma'

let corpus: WordRecord[] | null = null
let fuse: Fuse<WordRecord> | null = null
let loadedAt = 0

const TTL_MS = 86_400_000

let loadInFlight: Promise<WordRecord[]> | null = null

function mapRow(r: {
  id: string
  word: string
  baseForm: string
  type: string
  syllables: string
  syllableCount: number
  endingKey: string
  endingLast: string
  definition: string | null
  synonymsJson: string
  antonymsJson: string
}): WordRecord {
  let synonyms: string[] = []
  try {
    synonyms = JSON.parse(r.synonymsJson) as string[]
  } catch {
    synonyms = []
  }
  let antonyms: string[] = []
  try {
    antonyms = JSON.parse(r.antonymsJson) as string[]
  } catch {
    antonyms = []
  }
  return {
    id: r.id,
    word: r.word,
    baseForm: r.baseForm,
    type: r.type,
    syllables: r.syllables,
    syllableCount: r.syllableCount,
    endingKey: r.endingKey,
    endingLast: r.endingLast,
    definition: r.definition,
    synonyms,
    antonyms,
  }
}

function getFuse(): Fuse<WordRecord> | null {
  if (!corpus?.length) return null
  if (!fuse) {
    fuse = new Fuse(corpus, {
      keys: [
        { name: 'word', weight: 0.45 },
        { name: 'baseForm', weight: 0.25 },
        { name: 'definition', weight: 0.2 },
        { name: 'syllables', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  }
  return fuse
}

async function loadFromDb(): Promise<WordRecord[]> {
  const rows = await prisma.writeLexiconWord.findMany()
  corpus = rows.map(mapRow)
  fuse = null
  loadedAt = Date.now()
  return corpus
}

export async function loadWordCorpus(force = false): Promise<WordRecord[]> {
  const now = Date.now()
  if (!force && corpus && now - loadedAt < TTL_MS) {
    return corpus
  }
  if (loadInFlight) {
    return loadInFlight
  }
  loadInFlight = loadFromDb().finally(() => {
    loadInFlight = null
  })
  return loadInFlight
}

export function searchWords(query: string, limit: number): WordRecord[] {
  return queryByMode('fuzzy', query, limit)
}

export function queryByMode(
  mode: SearchMode,
  query: string,
  limit: number,
  options?: WordSearchOptions,
): WordRecord[] {
  if (!corpus) return []
  return queryCorpus(corpus, getFuse, mode, query, limit, options)
}

export type { SearchMode, WordSearchOptions }

export function getCorpusSnapshot(): WordRecord[] {
  return corpus ?? []
}

export function patchWordDefinitionInCorpus(id: string, definition: string | null) {
  if (!corpus) return
  const idx = corpus.findIndex((w) => w.id === id)
  if (idx === -1) return
  corpus[idx] = { ...corpus[idx]!, definition }
  fuse = null
}

const MERGED_QUERY_CAP = 5000
const MERGED_SEARCH_CACHE_TTL_MS = 60_000

let mergedSearchCache: { key: string; at: number; results: WordRecord[] } | null = null

function mergedSearchCacheKey(mode: SearchMode, terms: string[], options?: WordSearchOptions): string {
  return JSON.stringify({ mode, terms, options })
}

export function searchLexiconMerged(
  mode: SearchMode,
  terms: string[],
  options?: WordSearchOptions,
): WordRecord[] {
  if (!corpus?.length || !terms.length) return []

  if (mode === 'synonyms' || mode === 'antonyms') {
    const strict = options?.strictDiacritics === true
    const byNorm = new Map(corpus.map((w) => [normForSearch(w.word, strict), w] as const))
    const out: WordRecord[] = []
    const seen = new Set<string>()
    for (const q of terms) {
      const needleNorm = normForSearch(q.trim(), strict)
      if (!needleNorm) continue
      const bases = corpus.filter((w) => normForSearch(w.word, strict) === needleNorm)
      for (const base of bases) {
        const rel = mode === 'synonyms' ? base.synonyms : base.antonyms
        if (!rel?.length) continue
        for (const raw of rel) {
          const k = normForSearch(raw, strict)
          if (!k || seen.has(k)) continue
          seen.add(k)
          const hit = byNorm.get(k)
          if (hit) out.push(hit)
        }
      }
    }
    return sortWordRecordsByLength(out)
  }

  const seen = new Set<string>()
  const merged: WordRecord[] = []
  for (const q of terms) {
    const hits = queryByMode(mode, q, MERGED_QUERY_CAP, options)
    for (const h of hits) {
      if (!seen.has(h.id)) {
        seen.add(h.id)
        merged.push(h)
      }
    }
  }
  return sortWordRecordsByLength(merged)
}

export function searchLexiconPaged(
  mode: SearchMode,
  terms: string[],
  offset: number,
  limit: number,
  options?: WordSearchOptions,
): { results: WordRecord[]; total: number; hasMore: boolean } {
  const safeOffset = Math.max(0, offset)
  const safeLimit = Math.min(5000, Math.max(1, limit))
  const key = mergedSearchCacheKey(mode, terms, options)
  const now = Date.now()
  if (
    !mergedSearchCache
    || mergedSearchCache.key !== key
    || now - mergedSearchCache.at > MERGED_SEARCH_CACHE_TTL_MS
  ) {
    mergedSearchCache = { key, at: now, results: searchLexiconMerged(mode, terms, options) }
  }
  const all = mergedSearchCache.results
  const page = all.slice(safeOffset, safeOffset + safeLimit)
  return {
    results: page,
    total: all.length,
    hasMore: safeOffset + safeLimit < all.length,
  }
}

/** Reset in-memory corpus — for unit tests only. */
export function resetWordCorpusForTests(words: WordRecord[] | null = null) {
  corpus = words
  fuse = null
  mergedSearchCache = null
  loadedAt = words ? Date.now() : 0
  loadInFlight = null
}
