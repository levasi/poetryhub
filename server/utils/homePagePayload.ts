/**
 * Single server-side payload for the homepage — one DB round-trip from the client.
 * No external API calls; all data served straight from the database.
 */
import { prisma } from '~/server/utils/prisma'

/** Shared include for poem list cards (home feed, APIs). */
export const poemListInclude = {
  author: { select: { id: true, name: true, slug: true, imageUrl: true } },
  poemTags: {
    include: { tag: { select: { id: true, name: true, slug: true, category: true, color: true } } },
  },
} as const

export async function getHomePagePayload() {
  const [featured, moodTags, themeTags, spotlightAuthors] = await Promise.all([
    /** Poems with at least one favorite (♡), most liked first. */
    prisma.poem.findMany({
      where: { language: 'ro', favorites: { some: {} } },
      take: 36,
      orderBy: [{ favorites: { _count: 'desc' } }, { publishedAt: 'desc' }],
      include: poemListInclude,
    }),
    prisma.tag.findMany({
      where: { category: 'mood' },
      orderBy: { name: 'asc' },
      include: { _count: { select: { poemTags: true } } },
    }),
    prisma.tag.findMany({
      where: { category: 'theme' },
      orderBy: { name: 'asc' },
      include: { _count: { select: { poemTags: true } } },
    }),
    prisma.author.findMany({
      where: { poems: { some: { language: 'ro' } } },
      take: 12,
      orderBy: { poems: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: { select: { poems: true } },
      },
    }),
  ])

  return { featured, moodTags, themeTags, spotlightAuthors }
}
