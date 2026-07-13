// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'
import { fixtureLexicon } from '../fixtures/lexicon'

const loadWordCorpus = vi.fn()
const searchLexiconPaged = vi.fn()

vi.mock('../../server/utils/wordCorpus', () => ({
  loadWordCorpus,
  searchLexiconPaged,
}))

function buildEvent(query: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v)
    } else {
      params.set(key, value)
    }
  }
  const qs = params.toString()
  return createEvent({
    method: 'GET',
    url: qs ? `/api/words?${qs}` : '/api/words',
  })
}

describe('/api/words handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadWordCorpus.mockResolvedValue(fixtureLexicon)
    vi.stubGlobal('getQuery', (event: { path?: string; node?: { req?: { url?: string } } }) => {
      const url = event.node?.req?.url ?? event.path ?? ''
      const i = url.indexOf('?')
      const search = i === -1 ? '' : url.slice(i + 1)
      const params = new URLSearchParams(search)
      const out: Record<string, string | string[]> = {}
      for (const key of new Set([...params.keys()])) {
        const all = params.getAll(key)
        out[key] = all.length > 1 ? all : all[0]!
      }
      return out
    })
    vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    })
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
  })

  async function callWordsApi(query: Record<string, string | string[] | undefined>) {
    const event = buildEvent(query)
    event.node.req.url = event.path
    const { default: handler } = await import('../../server/api/words.get')
    return (handler as (e: typeof event) => Promise<unknown>)(event)
  }

  it('returns empty payload when q is missing', async () => {
    const res = await callWordsApi({})
    expect(res).toMatchObject({
      mode: 'fuzzy',
      query: [],
      total: 0,
      hasMore: false,
      results: [],
    })
    expect(searchLexiconPaged).not.toHaveBeenCalled()
  })

  it('passes search mode, pagination, and strict diacritics', async () => {
    searchLexiconPaged.mockReturnValue({
      results: [fixtureLexicon[0]],
      total: 1,
      hasMore: false,
    })
    const res = await callWordsApi({
      q: 'mare',
      mode: 'exact',
      offset: '10',
      limit: '50',
      strictDiacritics: 'true',
    }) as { results: { word: string; synonyms: string[] }[] }
    expect(loadWordCorpus).toHaveBeenCalled()
    expect(searchLexiconPaged).toHaveBeenCalledWith(
      'exact',
      ['mare'],
      10,
      50,
      { strictDiacritics: true },
    )
    expect(res.results).toHaveLength(1)
    expect(res.results[0]).toMatchObject({ word: 'mare', synonyms: ['vast', 'imens'] })
  })

  it('falls back to fuzzy for unknown mode', async () => {
    searchLexiconPaged.mockReturnValue({ results: [], total: 0, hasMore: false })
    await callWordsApi({ q: 'test', mode: 'invalid-mode' })
    expect(searchLexiconPaged).toHaveBeenCalledWith(
      'fuzzy',
      ['test'],
      0,
      500,
      { strictDiacritics: false },
    )
  })

  it('deduplicates multiple q params', async () => {
    searchLexiconPaged.mockReturnValue({ results: [], total: 0, hasMore: false })
    await callWordsApi({ q: ['mare', 'mare', 'vast'] })
    expect(searchLexiconPaged).toHaveBeenCalledWith(
      'fuzzy',
      ['mare', 'vast'],
      0,
      500,
      { strictDiacritics: false },
    )
  })

  it('maps contains syllable options', async () => {
    searchLexiconPaged.mockReturnValue({ results: [], total: 0, hasMore: false })
    await callWordsApi({
      q: 'mare',
      mode: 'contains',
      useSyllablesInSearch: '0',
      syllablesOverride: '["ma","re"]',
      syllablesMatchAll: '1',
    })
    expect(searchLexiconPaged).toHaveBeenCalledWith(
      'contains',
      ['mare'],
      0,
      500,
      expect.objectContaining({
        containsUseSyllables: false,
        containsSyllablesOverride: ['ma', 're'],
        containsSyllablesMatchAll: true,
      }),
    )
  })
})
