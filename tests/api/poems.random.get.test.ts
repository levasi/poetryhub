// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'
import { fixturePoem } from '../fixtures/poem'

const db = vi.hoisted(() => ({
  poem: { count: vi.fn(), findFirst: vi.fn() },
}))

vi.mock('../../server/utils/prisma', () => ({ prisma: db }))

describe('GET /api/poems/random', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    db.poem.count.mockResolvedValue(1)
    db.poem.findFirst.mockResolvedValue(fixturePoem)
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('returns a random poem', async () => {
    const res = await callHandler<{ slug: string }>(
      '../../server/api/poems/random.get',
      buildGetEvent(),
    )
    expect(res.slug).toBe('luceafarul')
  })

  it('filters by author slug', async () => {
    await callHandler('../../server/api/poems/random.get', buildGetEvent({ author: 'mihai-eminescu' }))
    expect(db.poem.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ author: { slug: 'mihai-eminescu' } }),
      }),
    )
  })

  it('returns 404 when no poems', async () => {
    db.poem.count.mockResolvedValue(0)
    await expect(
      callHandler('../../server/api/poems/random.get', buildGetEvent()),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})
