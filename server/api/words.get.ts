import { getCorpusSnapshot, loadWordCorpus, queryByMode, type SearchMode, type WordSearchOptions } from '../utils/wordCorpus'
import { normForSearch } from '../../lib/rhyme/normalize'

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

      // Relationship lookup must resolve the queried base word(s) only.
      // Do not broaden with "contains"/fuzzy here, otherwise synonym/antonym modes
      // will leak results from unrelated words.
      const needle = q.trim()
      if (!needle) return []
      const needleNorm = normForSearch(needle, strictDiacritics)
      const corpus = getCorpusSnapshot()
      const bases = corpus.filter((w) => normForSearch(w.word, strictDiacritics) === needleNorm)
      if (!bases.length) return []

      // Normalize lexicon words the same way we matched the base, so relation tokens
      // are matched consistently even when diacritics folding is enabled.
      const byNorm = new Map(corpus.map((w) => [normForSearch(w.word, strictDiacritics), w] as const))

      const out = []
      const seen = new Set<string>()
      for (const base of bases) {
        const rel = mode === 'synonyms' ? base.synonyms : base.antonyms
        if (!rel?.length) continue
        for (const raw of rel) {
          const k = normForSearch(raw, strictDiacritics)
          if (!k || seen.has(k)) continue
          seen.add(k)
          const hit = byNorm.get(k)
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
