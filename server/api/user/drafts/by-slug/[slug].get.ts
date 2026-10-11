// GET /api/user/drafts/by-slug/:slug — load one draft for `/write/<slug>`
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const d = await prisma.userPoemDraft.findFirst({
    where: { userId: tokenUser.id, slug: slug.trim() },
    select: {
      id: true,
      title: true,
      slug: true,
      authorName: true,
      language: true,
      content: true,
      savedWords: true,
      folderId: true,
      updatedAt: true,
      createdAt: true,
    },
  })
  if (!d) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })
  return {
    ...d,
    savedWords: Array.isArray(d.savedWords)
      ? d.savedWords.filter((w): w is string => typeof w === 'string')
      : [],
  }
})
