/**
 * POST /api/admin/invalidate-cache
 * Admin-only: bust all public Nitro handler caches (home, lists, settings, carousel defaults).
 */
import { requireAdmin } from '~/server/utils/auth'
import { invalidateCatalogCaches } from '~/server/utils/invalidatePublicCache'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  setHeader(event, 'cache-control', 'no-store')

  await invalidateCatalogCaches({
    home: true,
    poemsList: true,
    authorsList: true,
    tags: true,
    siteSettings: true,
    carouselDefaults: true,
  })

  return { ok: true }
})
