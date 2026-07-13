// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPostEvent, callHandler, stubNitroGlobals } from '../helpers/nitro'

const requireAdmin = vi.hoisted(() => vi.fn())
const invalidateCatalogCaches = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/auth', () => ({ requireAdmin }))
vi.mock('../../server/utils/invalidatePublicCache', () => ({ invalidateCatalogCaches }))

describe('POST /api/admin/invalidate-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNitroGlobals()
    requireAdmin.mockResolvedValue({ id: '1', email: 'admin@test.com', role: 'admin' })
    invalidateCatalogCaches.mockResolvedValue(undefined)
  })

  it('requires admin and busts all public catalog caches', async () => {
    const res = await callHandler<{ ok: boolean }>(
      '../../server/api/admin/invalidate-cache.post',
      buildPostEvent(),
    )
    expect(res.ok).toBe(true)
    expect(requireAdmin).toHaveBeenCalled()
    expect(invalidateCatalogCaches).toHaveBeenCalledWith({
      home: true,
      poemsList: true,
      authorsList: true,
      tags: true,
      siteSettings: true,
      carouselDefaults: true,
    })
  })
})
