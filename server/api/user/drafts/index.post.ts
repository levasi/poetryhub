// POST /api/user/drafts — create a draft (Write → Save)
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { draftBodySchema, normalizeSavedWords } from '~/server/utils/draftBody'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = draftBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const savedWords = normalizeSavedWords(parsed.data.savedWords)

  const d = await prisma.userPoemDraft.create({
    data: {
      userId: tokenUser.id,
      title: parsed.data.title,
      authorName: parsed.data.authorName,
      language: parsed.data.language,
      content: parsed.data.content,
      savedWords,
    },
    select: { id: true },
  })

  return d
})
