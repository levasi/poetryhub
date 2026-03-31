// GET /api/poems/random — returns one random poem
// Query: ?author=slug — random poem by that author only
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'

export default defineEventHandler(async (event) => {
  const authorSlug = getQuery(event).author
  const whereFilter = authorSlug
    ? { language: 'ro' as const, author: { slug: String(authorSlug) } }
    : { language: 'ro' as const }

  const count = await prisma.poem.count({ where: whereFilter })
  if (count === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: authorSlug ? 'No poems for this author' : 'No poems in database',
    })
  }

  const skip = Math.floor(Math.random() * count)

  const poem = await prisma.poem.findFirst({
    where: whereFilter,
    skip,
    orderBy: { id: 'asc' },
    include: {
      author:   { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } },
    },
  })

  if (!poem) {
    throw createError({ statusCode: 404, statusMessage: 'No poems in database' })
  }

  const author = await withResolvedAuthorPortrait(poem.author)
  return { ...poem, author }
})
