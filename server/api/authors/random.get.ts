// GET /api/authors/random — one random author who has at least one poem (+ bio + works list)
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'
import { ensureAuthorBio } from '~/server/utils/authorBio'

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

  const raw = await prisma.author.findUnique({
    where: { id: rows[0].id },
    include: { _count: { select: { poems: true } } },
  })
  if (!raw) {
    throw createError({ statusCode: 404, statusMessage: 'Author not found' })
  }

  let author = await withResolvedAuthorPortrait(raw)
  const bioText = await ensureAuthorBio(author)
  if (bioText && bioText !== author.bio) author = { ...author, bio: bioText }

  const works = await prisma.poem.findMany({
    where: { authorId: author.id, language: 'ro' },
    select: { title: true, slug: true },
    orderBy: { title: 'asc' },
  })

  return { ...author, works }
})
