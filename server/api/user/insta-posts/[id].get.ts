// GET /api/user/insta-posts/:id — load one saved Insta post
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { parseUserInstaPostPayload } from '~/utils/userInstaPost'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const row = await prisma.userInstaPost.findFirst({
    where: { id, userId: tokenUser.id },
    select: {
      id: true,
      title: true,
      authorName: true,
      poemSlug: true,
      payload: true,
      updatedAt: true,
      createdAt: true,
    },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Insta post not found' })

  const payload = parseUserInstaPostPayload(row.payload)
  if (!payload) throw createError({ statusCode: 500, statusMessage: 'Invalid saved Insta post data' })

  return {
    id: row.id,
    title: row.title,
    authorName: row.authorName,
    poemSlug: row.poemSlug,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    ...payload,
  }
})
