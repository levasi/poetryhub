// GET /api/poems/daily — deterministically returns "poem of the day"
// Uses day-of-year offset so the same poem shows all day, changes daily
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'
import { localDayKey } from '~/server/utils/cacheKeys'

export default defineCachedEventHandler(
  async () => {
  const where = { language: 'ro' as const }
  const count = await prisma.poem.count({ where })
  if (count === 0) throw createError({ statusCode: 404, statusMessage: 'No poems in database' })

  // Day-of-year: stable within a calendar day, cycles through all poems
  const now      = new Date()
  const start    = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  const skip      = dayOfYear % count

  const poem = await prisma.poem.findFirst({
    where,
    skip,
    orderBy: { createdAt: 'asc' },
    include: {
      author:   { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } },
    },
  })

  if (!poem) throw createError({ statusCode: 404, statusMessage: 'No poems in database' })

  const author = await withResolvedAuthorPortrait(poem.author)
  return { ...poem, author }
  },
  {
    name: 'api-poems-daily',
    maxAge: 3600,
    swr: true,
    getKey: () => `daily:${localDayKey()}`,
  },
)
