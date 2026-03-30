// GET /api/poems/:slug — fetch a single poem with full details
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  const poem = await prisma.poem.findUnique({
    where: { slug: slug! },
    include: {
      author: true,
      poemTags: {
        include: { tag: true },
      },
    },
  })

  if (!poem) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }

  const author = await withResolvedAuthorPortrait(poem.author)
  return { ...poem, author }
})
