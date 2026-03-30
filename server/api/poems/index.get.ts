// GET /api/poems
// Query params:
//   page, limit, author, tag, language, source, featured, search, excludeSlug
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page    = Math.max(1, parseInt(String(query.page  ?? 1)))
  const limit   = Math.min(50, Math.max(1, parseInt(String(query.limit ?? 12))))
  const skip    = (page - 1) * limit

  // Build dynamic Prisma filter
  const where: Record<string, unknown> = {}

  if (query.author)   where.author   = { slug: String(query.author) }
  if (query.excludeSlug) where.slug = { not: String(query.excludeSlug) }
  if (query.language) where.language = String(query.language)
  if (query.source)   where.source   = String(query.source)
  if (query.featured) where.featured = query.featured === 'true'

  if (query.tag) {
    where.poemTags = { some: { tag: { slug: String(query.tag) } } }
  }

  if (query.search) {
    const q = String(query.search)
    where.OR = [
      { title:   { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { author:  { name: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [poems, total] = await Promise.all([
    prisma.poem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, slug: true, imageUrl: true } },
        poemTags: {
          include: { tag: { select: { id: true, name: true, slug: true, category: true, color: true } } },
        },
      },
    }),
    prisma.poem.count({ where }),
  ])

  return {
    data: poems,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
