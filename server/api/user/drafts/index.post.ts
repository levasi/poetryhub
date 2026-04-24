// POST /api/user/drafts — create a draft (Write → Save)
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
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const d = await prisma.userPoemDraft.create({
    data: {
      userId: tokenUser.id,
      title: parsed.data.title,
      authorName: parsed.data.authorName,
      language: parsed.data.language,
      content: parsed.data.content,
    },
    select: { id: true },
  })

  return d
})

