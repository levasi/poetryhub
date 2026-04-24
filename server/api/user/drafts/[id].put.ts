// PUT /api/user/drafts/:id — update a draft
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  title: z.string().min(1).max(500).trim(),
  authorName: z.string().min(1).max(80).trim(),
  language: z.string().default('ro'),
  content: z.string().min(1).trim(),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const existing = await prisma.userPoemDraft.findFirst({
    where: { id, userId: tokenUser.id },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })

  await prisma.userPoemDraft.update({
    where: { id },
    data: {
      title: parsed.data.title,
      authorName: parsed.data.authorName,
      language: parsed.data.language,
      content: parsed.data.content,
    },
  })

  return { ok: true }
})

