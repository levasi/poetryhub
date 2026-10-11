// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const findMany = vi.fn()

vi.mock('~/server/utils/prisma', () => ({
  prisma: {
    userPoemDraft: {
      findMany,
    },
  },
}))

describe('ensureUniqueDraftSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns base slug when free', async () => {
    findMany.mockResolvedValue([])
    const { ensureUniqueDraftSlug } = await import('~/server/utils/slug')
    await expect(ensureUniqueDraftSlug('u1', 'Extinctorul pe boxe')).resolves.toBe(
      'extinctorul-pe-boxe',
    )
  })

  it('appends -2 when base is taken', async () => {
    findMany.mockResolvedValue([{ slug: 'extinctorul-pe-boxe' }])
    const { ensureUniqueDraftSlug } = await import('~/server/utils/slug')
    await expect(ensureUniqueDraftSlug('u1', 'Extinctorul pe boxe')).resolves.toBe(
      'extinctorul-pe-boxe-2',
    )
  })

  it('skips excludeId when checking collisions', async () => {
    findMany.mockResolvedValue([])
    const { ensureUniqueDraftSlug } = await import('~/server/utils/slug')
    await ensureUniqueDraftSlug('u1', 'Mare', 'draft-1')
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', id: { not: 'draft-1' } }),
      }),
    )
  })
})
