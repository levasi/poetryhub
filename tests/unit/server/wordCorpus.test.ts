// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import {
  resetWordCorpusForTests,
  searchLexiconMerged,
  searchLexiconPaged,
} from '~/server/utils/wordCorpus'
import { fixtureLexicon } from '../../fixtures/lexicon'

describe('wordCorpus search', () => {
  beforeEach(() => {
    resetWordCorpusForTests(fixtureLexicon)
  })

  it('returns empty when no terms', () => {
    expect(searchLexiconMerged('exact', [], undefined)).toEqual([])
    const paged = searchLexiconPaged('exact', [], 0, 10)
    expect(paged).toEqual({ results: [], total: 0, hasMore: false })
  })

  it('exact search finds diacritic word', () => {
    const hits = searchLexiconMerged('exact', ['măr'], { strictDiacritics: true })
    expect(hits.map((h) => h.word)).toEqual(['măr'])
  })

  it('synonyms expand related lexicon entries', () => {
    const hits = searchLexiconMerged('synonyms', ['mare'], { strictDiacritics: false })
    const words = hits.map((h) => h.word)
    expect(words).toContain('vast')
    expect(words).not.toContain('mare')
  })

  it('antonyms expand opposite entries', () => {
    const hits = searchLexiconMerged('antonyms', ['mare'], { strictDiacritics: false })
    expect(hits.map((h) => h.word)).toContain('mic')
  })

  it('paginates merged results', () => {
    const page1 = searchLexiconPaged('starts', ['m'], 0, 1)
    const page2 = searchLexiconPaged('starts', ['m'], 1, 1)
    expect(page1.results).toHaveLength(1)
    expect(page1.hasMore).toBe(true)
    expect(page2.results).toHaveLength(1)
    expect(page1.results[0]!.id).not.toBe(page2.results[0]!.id)
  })

  it('clamps limit and offset', () => {
    const paged = searchLexiconPaged('starts', ['m'], -5, 9999)
    expect(paged.results.length).toBeLessThanOrEqual(5000)
  })
})
