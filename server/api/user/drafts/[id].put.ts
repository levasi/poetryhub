// PUT /api/user/drafts/:id — update a draft
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { draftBodySchema, normalizeSavedWords } from '~/server/utils/draftBody'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = draftBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const existing = await prisma.userPoemDraft.findFirst({
    where: { id, userId: tokenUser.id },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })

  const savedWords = normalizeSavedWords(parsed.data.savedWords)

  await prisma.userPoemDraft.update({
    where: { id },
    data: {
      title: parsed.data.title,
      authorName: parsed.data.authorName,
      language: parsed.data.language,
      content: parsed.data.content,
      savedWords,
    },
  })

  return { ok: true }
})
