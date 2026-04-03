// GET /api/user/poems — list poems submitted by the logged-in user
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

  const [poems, total] = await Promise.all([
    prisma.poem.findMany({
      where: { submittedByUserId: tokenUser.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        author:   { select: { id: true, name: true, slug: true } },
        poemTags: { include: { tag: { select: { id: true, slug: true, name: true } } } },
      },
    }),
    prisma.poem.count({ where: { submittedByUserId: tokenUser.id } }),
  ])

  return {
    data: poems,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
