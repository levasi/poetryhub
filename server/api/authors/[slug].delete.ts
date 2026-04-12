// DELETE /api/authors/:slug — admin session or site owner (user JWT)
import { prisma } from '~/server/utils/prisma'
import { requireAdminOrSiteOwnerUser } from '~/server/utils/auth'
import { invalidateCachesAfterAuthorDelete } from '~/server/utils/invalidatePublicCache'

export default defineEventHandler(async (event) => {
  await requireAdminOrSiteOwnerUser(event)
  const slug = getRouterParam(event, 'slug')!
  const existing = await prisma.author.findUnique({ where: { slug } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Author not found' })

  const poemSlugs = await prisma.poem.findMany({
    where: { authorId: existing.id },
    select: { slug: true },
  }).then((rows) => rows.map((r) => r.slug))

  await prisma.author.delete({ where: { slug } })
  await invalidateCachesAfterAuthorDelete(slug, poemSlugs)

  return { ok: true }
})
