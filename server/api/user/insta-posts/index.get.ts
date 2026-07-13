// GET /api/user/insta-posts — list saved Insta posts
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const { page, limit } = querySchema.parse(getQuery(event))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.userInstaPost.findMany({
      where: { userId: tokenUser.id },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        authorName: true,
        poemSlug: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    prisma.userInstaPost.count({ where: { userId: tokenUser.id } }),
  ])

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
