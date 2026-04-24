// GET /api/user/drafts/:id — load one draft for `/write`
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const d = await prisma.userPoemDraft.findFirst({
    where: { id, userId: tokenUser.id },
    select: {
      id: true,
      title: true,
      authorName: true,
      language: true,
      content: true,
      updatedAt: true,
      createdAt: true,
    },
  })
  if (!d) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })
  return d
})

