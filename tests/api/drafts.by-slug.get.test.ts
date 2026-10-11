// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'

const requireUser = vi.fn()
const findFirst = vi.fn()

vi.mock('../../server/utils/auth', () => ({
  requireUser,
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    userPoemDraft: {
      findFirst,
    },
  },
}))

describe('GET /api/user/drafts/by-slug/:slug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireUser.mockResolvedValue({ id: 'user-1' })
    vi.stubGlobal('getRouterParam', (_e: unknown, name: string) =>
      name === 'slug' ? 'extinctorul-pe-boxe' : undefined,
    )
    vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    })
    vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
  })

  it('returns the draft for the current user', async () => {
    findFirst.mockResolvedValue({
      id: 'd1',
      title: 'Extinctorul pe boxe',
      slug: 'extinctorul-pe-boxe',
      authorName: 'Ana',
      language: 'ro',
      content: 'vers',
      savedWords: ['stradă'],
      folderId: null,
      updatedAt: new Date(),
      createdAt: new Date(),
    })
    const { default: handler } = await import('../../server/api/user/drafts/by-slug/[slug].get')
    const event = createEvent({ method: 'GET', url: '/api/user/drafts/by-slug/extinctorul-pe-boxe' })
    const res = await (handler as (e: typeof event) => Promise<Record<string, unknown>>)(event)
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', slug: 'extinctorul-pe-boxe' },
      }),
    )
    expect(res).toMatchObject({
      id: 'd1',
      slug: 'extinctorul-pe-boxe',
      savedWords: ['stradă'],
    })
  })
})
