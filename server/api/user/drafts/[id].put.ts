// PUT /api/user/drafts/:id — update a draft
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { draftBodySchema, normalizeSavedWords } from '~/server/utils/draftBody'
import { ensureUniqueDraftSlug } from '~/server/utils/slug'

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
    select: { id: true, title: true, slug: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })

  const savedWords = normalizeSavedWords(parsed.data.savedWords)
  const titleChanged = existing.title.trim() !== parsed.data.title.trim()
  /** Interim migration slugs look like `proiect-<cuid>` — upgrade on next save. */
  const interimSlug = /^proiect-[a-z0-9]+$/i.test(existing.slug || '')

  let slug = existing.slug
  if (titleChanged || interimSlug || !slug) {
    slug = await ensureUniqueDraftSlug(tokenUser.id, parsed.data.title, id)
  }

  const data: {
    title: string
    slug: string
    authorName: string
    language: string
    content: string
    savedWords: string[]
    folderId?: string | null
  } = {
    title: parsed.data.title,
    slug,
    authorName: parsed.data.authorName,
    language: parsed.data.language,
    content: parsed.data.content,
    savedWords,
  }

  if (parsed.data.folderId !== undefined) {
    if (parsed.data.folderId === null) {
      data.folderId = null
    } else {
      const folder = await prisma.userWriteFolder.findFirst({
        where: { id: parsed.data.folderId, userId: tokenUser.id },
        select: { id: true },
      })
      if (!folder) throw createError({ statusCode: 400, statusMessage: 'Invalid folder' })
      data.folderId = folder.id
    }
  }

  await prisma.userPoemDraft.update({
    where: { id },
    data,
  })

  return { ok: true, slug }
})
