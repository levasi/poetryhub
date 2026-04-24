// GET /api/user/drafts — list poem drafts saved from `/write`
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const querySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const { page, limit } = querySchema.parse(getQuery(event))
  const skip = (page - 1) * limit

  const [drafts, total] = await Promise.all([
    prisma.userPoemDraft.findMany({
      where: { userId: tokenUser.id },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        authorName: true,
        language: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    prisma.userPoemDraft.count({ where: { userId: tokenUser.id } }),
  ])

  return {
    data: drafts,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})

