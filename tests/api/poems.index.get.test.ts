// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'
import { fixturePoem } from '../fixtures/poem'

const prisma = {
  poem: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
}

vi.mock('../../server/utils/prisma', () => ({ prisma }))

describe('GET /api/poems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    prisma.poem.findMany.mockResolvedValue([fixturePoem])
    prisma.poem.count.mockResolvedValue(1)
  })

  it('returns paginated Romanian poems', async () => {
    const res = await callHandler<{
      data: unknown[]
      meta: { page: number; limit: number; total: number; totalPages: number }
    }>('../../server/api/poems/index.get', buildGetEvent({ page: '1', limit: '12' }))

    expect(res.data).toHaveLength(1)
    expect(res.meta).toMatchObject({ page: 1, limit: 12, total: 1, totalPages: 1 })
    expect(prisma.poem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ language: 'ro' }),
        skip: 0,
        take: 12,
      }),
    )
  })

  it('applies author and search filters', async () => {
    await callHandler(
      '../../server/api/poems/index.get',
      buildGetEvent({ author: 'mihai-eminescu', search: 'luce' }),
    )
    expect(prisma.poem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          author: { slug: 'mihai-eminescu' },
          OR: expect.any(Array),
        }),
      }),
    )
  })

  it('caps limit at 50', async () => {
    await callHandler('../../server/api/poems/index.get', buildGetEvent({ limit: '999' }))
    expect(prisma.poem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    )
  })
})
