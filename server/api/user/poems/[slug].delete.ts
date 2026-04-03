// DELETE /api/user/poems/[slug] — delete a user's own submitted poem
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const poem = await prisma.poem.findUnique({ where: { slug } })
  if (!poem) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }
  if (poem.submittedByUserId !== tokenUser.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await prisma.poem.delete({ where: { slug } })
  return { ok: true }
})
