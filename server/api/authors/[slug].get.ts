// GET /api/authors/:slug — author profile + their poems (paginated) + works list (bibliography)
import { prisma } from '~/server/utils/prisma'
import { ensureAuthorPortraitUrl } from '~/server/utils/authorPortrait'
import { ensureAuthorBio } from '~/server/utils/authorBio'

export default defineEventHandler(async (event) => {
  const slug  = getRouterParam(event, 'slug')!
  const query = getQuery(event)
  const page  = Math.max(1, parseInt(String(query.page  ?? 1)))
  const limit = Math.min(50, Math.max(1, parseInt(String(query.limit ?? 10))))
  const skip  = (page - 1) * limit

  let author = await prisma.author.findUnique({ where: { slug } })
  if (!author) throw createError({ statusCode: 404, statusMessage: 'Author not found' })

  const portraitUrl = await ensureAuthorPortraitUrl(author)
  if (portraitUrl && portraitUrl !== author.imageUrl) author = { ...author, imageUrl: portraitUrl }

  const bioText = await ensureAuthorBio(author)
  if (bioText && bioText !== author.bio) author = { ...author, bio: bioText }

  const [poems, total, works] = await Promise.all([
    prisma.poem.findMany({
      where: { authorId: author.id },
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        poemTags: { include: { tag: true } },
      },
    }),
    prisma.poem.count({ where: { authorId: author.id } }),
    prisma.poem.findMany({
      where: { authorId: author.id },
      select: { title: true, slug: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return {
    author,
    works,
    poems: {
      data: poems,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  }
})
