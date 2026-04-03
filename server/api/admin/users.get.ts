// GET /api/admin/users — list all registered users (admin only)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  search: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const { page, limit, search } = querySchema.parse(q)
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { favorites: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
