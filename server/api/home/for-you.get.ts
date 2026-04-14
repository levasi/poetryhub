// GET /api/home/for-you — paginated “For you” feed (Romanian poems, newest first)
import { prisma } from '~/server/utils/prisma'
import { poemListInclude } from '~/server/utils/homePagePayload'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(String(q.limit ?? '5'), 10) || 5))
  const skip = (page - 1) * limit

  const where = { language: 'ro' as const }

  const [data, total] = await Promise.all([
    prisma.poem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: poemListInclude,
    }),
    prisma.poem.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  }
})
