// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'
import { fixturePoem } from '../fixtures/poem'

const db = vi.hoisted(() => ({
  poem: { findMany: vi.fn() },
}))

vi.mock('../../server/utils/prisma', () => ({ prisma: db }))

describe('GET /api/poems/by-ids', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
  })

  it('returns empty data when ids missing', async () => {
    const res = await callHandler<{ data: unknown[] }>(
      '../../server/api/poems/by-ids.get',
      buildGetEvent(),
    )
    expect(res).toEqual({ data: [] })
    expect(db.poem.findMany).not.toHaveBeenCalled()
  })

  it('preserves requested id order', async () => {
    const poemB = { ...fixturePoem, id: 'b', slug: 'b' }
    const poemA = { ...fixturePoem, id: 'a', slug: 'a' }
    db.poem.findMany.mockResolvedValue([poemA, poemB])

    const res = await callHandler<{ data: { id: string }[] }>(
      '../../server/api/poems/by-ids.get',
      buildGetEvent({ ids: 'b,a' }),
    )
    expect(res.data.map((p) => p.id)).toEqual(['b', 'a'])
  })
})
