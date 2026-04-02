// GET /api/authors — list all authors with poem counts
import { prisma } from '~/server/utils/prisma'
import { stableQueryKey } from '~/server/utils/cacheKeys'

export default defineCachedEventHandler(
  async (event) => {
  const query  = getQuery(event)
  const page   = Math.max(1, parseInt(String(query.page  ?? 1)))
  const limit  = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20))))
  const skip   = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (query.search) {
    where.name = { contains: String(query.search), mode: 'insensitive' }
  }

  const [authors, total] = await Promise.all([
    prisma.author.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: { _count: { select: { poems: true } } },
    }),
    prisma.author.count({ where }),
  ])

  return {
    data: authors,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
  },
  {
    name: 'api-authors-list',
    maxAge: 60,
    swr: true,
    getKey: (event) => stableQueryKey('authors', event),
  },
)
