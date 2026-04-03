// GET /api/authors/random — one random author who has at least one poem + works list
// Served straight from the database — no external Wikipedia calls.
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT a.id FROM "Author" a
    WHERE EXISTS (SELECT 1 FROM "Poem" p WHERE p."authorId" = a.id AND p.language = 'ro')
    ORDER BY RANDOM()
    LIMIT 1
  `
  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'No authors with poems' })
  }

  // Fetch author details + works in parallel
  const [raw, works] = await Promise.all([
    prisma.author.findUnique({
      where: { id: rows[0]!.id },
      include: { _count: { select: { poems: true } } },
    }),
    prisma.poem.findMany({
      where: { authorId: rows[0]!.id, language: 'ro' },
      select: { title: true, slug: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!raw) {
    throw createError({ statusCode: 404, statusMessage: 'Author not found' })
  }

  return { ...raw, works }
})
