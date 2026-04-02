import Fuse from 'fuse.js'
import type { WordRecord } from '../../lib/rhyme/types'
import { queryCorpus, type SearchMode, type WordSearchOptions } from '../../lib/rhyme/wordQueries'
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
}): WordRecord {
  let synonyms: string[] = []
  try {
    synonyms = JSON.parse(r.synonymsJson) as string[]
  } catch {
    synonyms = []
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
