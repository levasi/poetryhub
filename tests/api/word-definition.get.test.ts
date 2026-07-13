// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const prisma = {
  writeLexiconWord: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

const patchWordDefinitionInCorpus = vi.fn()
const fetchWikipediaRoExtract = vi.fn()
const fetchWiktionaryRoExtract = vi.fn()

vi.mock('../../server/utils/prisma', () => ({ prisma }))
vi.mock('../../server/utils/wordCorpus', () => ({ patchWordDefinitionInCorpus }))
vi.mock('../../server/utils/wikipediaRo', () => ({ fetchWikipediaRoExtract }))
vi.mock('../../server/utils/wiktionaryRo', () => ({ fetchWiktionaryRoExtract }))

describe('GET /api/word-definition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
  })

  it('requires id query param', async () => {
    await expect(
      callHandler('../../server/api/word-definition.get', buildGetEvent()),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns existing DB definition', async () => {
    prisma.writeLexiconWord.findUnique.mockResolvedValue({
      id: 'w1',
      word: 'mare',
      definition: 'extins',
    })
    const res = await callHandler<{ source: string; definition: string }>(
      '../../server/api/word-definition.get',
      buildGetEvent({ id: 'w1' }),
    )
    expect(res).toEqual({ word: 'mare', definition: 'extins', source: 'db' })
  })

  it('fetches from wikipedia when DB definition empty', async () => {
    prisma.writeLexiconWord.findUnique.mockResolvedValue({
      id: 'w1',
      word: 'mare',
      definition: '',
    })
    fetchWikipediaRoExtract.mockResolvedValue('definiție wiki')
    prisma.writeLexiconWord.update.mockResolvedValue({})
    const res = await callHandler<{ source: string }>(
      '../../server/api/word-definition.get',
      buildGetEvent({ id: 'w1' }),
    )
    expect(res.source).toBe('wikipedia')
    expect(patchWordDefinitionInCorpus).toHaveBeenCalledWith('w1', 'definiție wiki')
  })

  it('returns 404 when word not found', async () => {
    prisma.writeLexiconWord.findUnique.mockResolvedValue(null)
    await expect(
      callHandler('../../server/api/word-definition.get', buildGetEvent({ id: 'missing' })),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})
