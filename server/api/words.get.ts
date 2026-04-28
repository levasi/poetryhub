import { getCorpusSnapshot, loadWordCorpus, queryByMode, type SearchMode, type WordSearchOptions } from '../utils/wordCorpus'

const MODES: SearchMode[] = ['fuzzy', 'starts', 'ends', 'contains', 'anagram', 'exact', 'synonyms', 'antonyms']

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
    const rawMatchAll = query.syllablesMatchAll?.toString().toLowerCase()
    wordSearchOptions.containsSyllablesMatchAll =
      rawMatchAll === '1' || rawMatchAll === 'true'
  }

  try {
    await loadWordCorpus()
    const results = (() => {
      if (mode !== 'synonyms' && mode !== 'antonyms') {
        return queryByMode(mode, q, limit, wordSearchOptions)
      }

      // Relationship lookup: search *everywhere* for base words, then expand their relations.
      // We intentionally use `contains` without syllable-OR for predictable substring search.
      const bases = queryByMode('contains', q, 250, {
        ...wordSearchOptions,
        containsUseSyllables: false,
        containsSyllablesOverride: null,
        containsSyllablesMatchAll: false,
      })
      if (!bases.length) return []

      const corpus = getCorpusSnapshot()
      const byLower = new Map(corpus.map((w) => [w.word.toLowerCase(), w] as const))

      const out = []
      const seen = new Set<string>()
      for (const base of bases) {
        const rel = mode === 'synonyms' ? base.synonyms : base.antonyms
        if (!rel?.length) continue
        for (const raw of rel) {
          const k = raw.trim().toLowerCase()
          if (!k || seen.has(k)) continue
          seen.add(k)
          const hit = byLower.get(k)
          if (hit) out.push(hit)
          if (out.length >= limit) return out
        }
      }
      return out
    })()
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
        antonyms: w.antonyms,
      })),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/words]', err)
    throw createError({ statusCode: 500, statusMessage: message })
  }
})
