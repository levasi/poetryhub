// DELETE /api/poems/:slug — remove a poem (admin JWT, or carousel owner user session)
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { verifyAdminToken, getUserFromEvent, TOKEN_COOKIE } from '~/server/utils/auth'
import { userCanManageCarouselDefaults } from '~/utils/carouselDefaultsAdmin'

async function authorizeDeletePoem(event: H3Event) {
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
  const config = useRuntimeConfig()
  if (
    !userCanManageCarouselDefaults(user, config.public.carouselDefaultsAdminEmail as string | undefined)
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export default defineEventHandler(async (event) => {
  await authorizeDeletePoem(event)

  const slug = getRouterParam(event, 'slug')!
  const existing = await prisma.poem.findUnique({ where: { slug } })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }

  await prisma.poem.delete({ where: { slug } })
  return { ok: true }
})
