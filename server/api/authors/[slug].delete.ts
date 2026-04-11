// DELETE /api/authors/:slug — admin session or site owner (user JWT)
import { prisma } from '~/server/utils/prisma'
import { requireAdminOrSiteOwnerUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminOrSiteOwnerUser(event)
  const slug = getRouterParam(event, 'slug')!
  const existing = await prisma.author.findUnique({ where: { slug } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Author not found' })

  await prisma.author.delete({ where: { slug } })
  return { ok: true }
})
