import {
  loadWordCorpus,
  searchLexiconPaged,
  type SearchMode,
  type WordSearchOptions,
} from '../utils/wordCorpus'

const MODES: SearchMode[] = ['fuzzy', 'starts', 'ends', 'contains', 'anagram', 'exact', 'synonyms', 'antonyms']

function parseQueryTerms(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : raw != null ? [raw] : []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of parts) {
    const term = String(item).trim()
    if (!term || seen.has(term)) continue
    seen.add(term)
    out.push(term)
  }
  return out
}

function mapWord(w: {
  id: string
  word: string
  baseForm: string
  type: string
  syllables: string
  syllableCount: number
  definition: string | null
  synonyms: string[]
  antonyms: string[]
}) {
  return {
    id: w.id,
    word: w.word,
    baseForm: w.baseForm,
    type: w.type,
    syllables: w.syllables,
    syllableCount: w.syllableCount,
    definition: w.definition,
    synonyms: w.synonyms,
    antonyms: w.antonyms,
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const terms = parseQueryTerms(query.q)
  const rawMode = query.mode?.toString() ?? 'fuzzy'
  const mode = (MODES.includes(rawMode as SearchMode) ? rawMode : 'fuzzy') as SearchMode
  const limit = Math.min(5000, Math.max(1, Number(query.limit) || 500))
  const offset = Math.max(0, Number(query.offset) || 0)

  const rawStrict = query.strictDiacritics?.toString().toLowerCase()
  const strictDiacritics = rawStrict === '1' || rawStrict === 'true'

  const wordSearchOptions: WordSearchOptions = {
    strictDiacritics,
  }

  if (mode === 'contains') {
    const rawUse = query.useSyllablesInSearch?.toString().toLowerCase()
    const containsUseSyllables = rawUse !== '0' && rawUse !== 'false'
    let containsSyllablesOverride: string[] | null | undefined
    const rawSyl = query.syllablesOverride?.toString()
    if (rawSyl && rawSyl.length > 0) {
      try {
        const parsed = JSON.parse(rawSyl) as unknown
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          containsSyllablesOverride = parsed
        }
      } catch {
        /* ignore */
      }
    }
    wordSearchOptions.containsUseSyllables = containsUseSyllables
    wordSearchOptions.containsSyllablesOverride = containsSyllablesOverride ?? null
    const rawMatchAll = query.syllablesMatchAll?.toString().toLowerCase()
    wordSearchOptions.containsSyllablesMatchAll =
      rawMatchAll === '1' || rawMatchAll === 'true'
  }

  try {
    await loadWordCorpus()
    if (!terms.length) {
      return { mode, query: terms, offset, limit, total: 0, hasMore: false, results: [] }
    }

    const { results, total, hasMore } = searchLexiconPaged(mode, terms, offset, limit, wordSearchOptions)
    return {
      mode,
      query: terms,
      offset,
      limit,
      total,
      hasMore,
      results: results.map(mapWord),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/words]', err)
    throw createError({ statusCode: 500, statusMessage: message })
  }
})
