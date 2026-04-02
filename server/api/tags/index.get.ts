// GET /api/tags — list all tags, optionally filtered by category
import { prisma } from '~/server/utils/prisma'

export default defineCachedEventHandler(
  async (event) => {
    const { category } = getQuery(event)
    const where = category ? { category: String(category) } : {}

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { poemTags: true } } },
    })

    return tags
  },
  {
    name: 'api-tags',
    maxAge: 300,
    swr: true,
    getKey: (event) => {
      const { category } = getQuery(event)
      return `tags:${String(category ?? 'all')}`
    },
  },
)
