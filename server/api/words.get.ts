import { loadWordCorpus, queryByMode, type SearchMode, type WordSearchOptions } from '../utils/wordCorpus'

const MODES: SearchMode[] = ['fuzzy', 'starts', 'ends', 'contains', 'anagram', 'exact']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q?.toString() ?? ''
  const rawMode = query.mode?.toString() ?? 'fuzzy'
  const mode = (MODES.includes(rawMode as SearchMode) ? rawMode : 'fuzzy') as SearchMode
  const limit = Math.min(5000, Math.max(1, Number(query.limit) || 500))

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
  }

  try {
    await loadWordCorpus()
    const results = queryByMode(mode, q, limit, wordSearchOptions)
    return {
      mode,
      query: q,
      results: results.map((w) => ({
        id: w.id,
        word: w.word,
        baseForm: w.baseForm,
        type: w.type,
        syllables: w.syllables,
        syllableCount: w.syllableCount,
        definition: w.definition,
        synonyms: w.synonyms,
      })),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/words]', err)
    throw createError({ statusCode: 500, statusMessage: message })
  }
})
