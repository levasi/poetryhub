// POST /api/user/drafts — create a draft (Write → Save)
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { draftBodySchema, normalizeSavedWords } from '~/server/utils/draftBody'
import { ensureUniqueDraftSlug } from '~/server/utils/slug'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = draftBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const savedWords = normalizeSavedWords(parsed.data.savedWords)
  let folderId: string | null = null
  if (parsed.data.folderId) {
    const folder = await prisma.userWriteFolder.findFirst({
      where: { id: parsed.data.folderId, userId: tokenUser.id },
      select: { id: true },
    })
    if (!folder) throw createError({ statusCode: 400, statusMessage: 'Invalid folder' })
    folderId = folder.id
  }

  const slug = await ensureUniqueDraftSlug(tokenUser.id, parsed.data.title)

  const d = await prisma.userPoemDraft.create({
    data: {
      userId: tokenUser.id,
      folderId,
      title: parsed.data.title,
      slug,
      authorName: parsed.data.authorName,
      language: parsed.data.language,
      content: parsed.data.content,
      savedWords,
    },
    select: { id: true, slug: true, folderId: true },
  })

  return d
})
