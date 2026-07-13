// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fixturePoem } from '../../fixtures/poem'

const db = vi.hoisted(() => ({
  poem: { findMany: vi.fn() },
  tag: { findMany: vi.fn() },
  author: { findMany: vi.fn() },
}))

vi.mock('~/server/utils/prisma', () => ({ prisma: db }))

describe('getHomePagePayload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    db.poem.findMany.mockResolvedValueOnce([fixturePoem])
    db.tag.findMany
      .mockResolvedValueOnce([{ id: 'm1', name: 'Mood', category: 'mood' }])
      .mockResolvedValueOnce([{ id: 't1', name: 'Theme', category: 'theme' }])
    db.author.findMany.mockResolvedValue([
      { id: 'a1', name: 'Eminescu', slug: 'eminescu', imageUrl: null, _count: { poems: 3 } },
    ])
  })

  it('loads featured, tags, and author spotlight', async () => {
    const { getHomePagePayload } = await import('~/server/utils/homePagePayload')
    const payload = await getHomePagePayload()
    expect(payload.featured).toHaveLength(1)
    expect(payload.moodTags).toHaveLength(1)
    expect(payload.themeTags).toHaveLength(1)
    expect(payload.spotlightAuthors).toHaveLength(1)
    expect(db.poem.findMany).toHaveBeenCalledTimes(1)
    expect(db.tag.findMany).toHaveBeenCalledTimes(2)
    expect(db.author.findMany).toHaveBeenCalledTimes(1)
  })
})
