// DELETE /api/poems/:slug — remove a poem (admin only)
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const slug = getRouterParam(event, 'slug')!
  const existing = await prisma.poem.findUnique({ where: { slug } })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }

  await prisma.poem.delete({ where: { slug } })
  return { ok: true }
})
