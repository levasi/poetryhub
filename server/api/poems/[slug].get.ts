// GET /api/poems/:slug — fetch a single poem with full details
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'

export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')

    const poem = await prisma.poem.findUnique({
      where: { slug: slug! },
      include: {
        author: true,
        poemTags: { include: { tag: true } },
      },
    })

    if (!poem) {
      throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
    }

    /** Same as author profile API: Wikipedia portrait when missing, persisted on `Author`. */
    const author = await withResolvedAuthorPortrait(poem.author)

    const neighborSelect = { slug: true, title: true } as const

    // Same order as GET /api/poems: publishedAt desc, then id (stable tiebreaker).
    // "Newer" = toward the top of the catalog list; "Older" = toward the bottom.
    const [newer, older] = await Promise.all([
      prisma.poem.findFirst({
        where: {
          language: 'ro',
          OR: [
            { publishedAt: { gt: poem.publishedAt } },
            { AND: [{ publishedAt: poem.publishedAt }, { id: { gt: poem.id } }] },
          ],
        },
        orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
        select: neighborSelect,
      }),
      prisma.poem.findFirst({
        where: {
          language: 'ro',
          OR: [
            { publishedAt: { lt: poem.publishedAt } },
            { AND: [{ publishedAt: poem.publishedAt }, { id: { lt: poem.id } }] },
          ],
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        select: neighborSelect,
      }),
    ])

    return {
      ...poem,
      author,
      navigation: {
        newer: newer ? { slug: newer.slug, title: newer.title } : null,
        older: older ? { slug: older.slug, title: older.title } : null,
      },
    }
  },
  {
    name: 'api-poem-by-slug',
    maxAge: 45,
    swr: true,
    getKey: (event) => `poem:${getRouterParam(event, 'slug') ?? ''}`,
  },
)
