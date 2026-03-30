// GET /api/authors/random — one random author who has at least one poem
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'

export default defineEventHandler(async () => {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT a.id FROM "Author" a
    WHERE EXISTS (SELECT 1 FROM "Poem" p WHERE p."authorId" = a.id)
    ORDER BY RANDOM()
    LIMIT 1
  `
  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'No authors with poems' })
  }

  const raw = await prisma.author.findUnique({
    where: { id: rows[0].id },
    include: { _count: { select: { poems: true } } },
  })
  if (!raw) {
    throw createError({ statusCode: 404, statusMessage: 'Author not found' })
  }

  return withResolvedAuthorPortrait(raw)
})
