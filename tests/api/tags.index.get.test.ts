// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const prisma = {
  tag: { findMany: vi.fn() },
}

vi.mock('../../server/utils/prisma', () => ({ prisma }))

describe('GET /api/tags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    prisma.tag.findMany.mockResolvedValue([
      { id: '1', name: 'Natură', slug: 'nature', _count: { poemTags: 3 } },
    ])
  })

  it('lists all tags when no category filter', async () => {
    const res = await callHandler<unknown[]>('../../server/api/tags/index.get', buildGetEvent())
    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
    expect(res).toHaveLength(1)
  })

  it('filters by category query param', async () => {
    await callHandler('../../server/api/tags/index.get', buildGetEvent({ category: 'mood' }))
    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'mood' } }),
    )
  })
})
