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
  const [featured, recent, moodTags, themeTags] = await Promise.all([
    prisma.poem.findMany({
      where: { language: 'ro', featured: true },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      include: poemListInclude,
    }),
    prisma.poem.findMany({
      where: { language: 'ro' },
      take: 8,
      orderBy: { publishedAt: 'desc' },
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
  ])

  return { featured, recent, moodTags, themeTags }
}
