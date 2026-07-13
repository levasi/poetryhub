// DELETE /api/poems/:slug — remove a poem (admin JWT, or user session if submitter)
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { verifyAdminToken, getUserFromEvent, TOKEN_COOKIE } from '~/server/utils/auth'
import { userCanEditPoem } from '~/server/utils/poemEditAuth'
import {
  invalidateAuthorDetailCaches,
  invalidateCatalogListCaches,
  invalidatePoemCaches,
} from '~/server/utils/invalidatePublicCache'

async function authorizeDeletePoem(
  event: H3Event,
  poem: { submittedByUserId: string | null },
) {
  const adminToken =
    getCookie(event, TOKEN_COOKIE) ??
    event.node.req.headers.authorization?.replace('Bearer ', '')
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken)
    if (payload?.role === 'admin') return
  }
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!userCanEditPoem(user, poem)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const existing = await prisma.poem.findUnique({
    where: { slug },
    select: { submittedByUserId: true, author: { select: { slug: true } } },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }

  await authorizeDeletePoem(event, existing)

  await prisma.poem.delete({ where: { slug } })

  await invalidatePoemCaches(slug)
  await invalidateCatalogListCaches()
  const authorSlug = existing.author?.slug
  if (authorSlug) await invalidateAuthorDetailCaches(authorSlug)

  return { ok: true }
})
