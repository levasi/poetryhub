/**
 * Single server-side payload for the homepage — one DB round-trip from the client.
 * No external API calls; all data served straight from the database.
 */
import { prisma } from '~/server/utils/prisma'

const poemListInclude = {
  author: { select: { id: true, name: true, slug: true, imageUrl: true } },
  poemTags: {
    include: { tag: { select: { id: true, name: true, slug: true, category: true, color: true } } },
  },
} as const

export async function buildHomeHero() {
  try {
    // Pick a random author who has at least one Romanian poem
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT a.id FROM "Author" a
      WHERE EXISTS (SELECT 1 FROM "Poem" p WHERE p."authorId" = a.id AND p.language = 'ro')
      ORDER BY RANDOM()
      LIMIT 1
    `
    if (!rows.length) return null

    // Fetch author + their works in parallel (no Wikipedia calls)
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
    if (!raw || works.length === 0) return null

    const author = { ...raw, works }

    // Pick a random poem from the already-fetched works list (no extra count query)
    const randomWork = works[Math.floor(Math.random() * works.length)]!
    const poem = await prisma.poem.findFirst({
      where: { slug: randomWork.slug },
      include: {
        author: { select: { id: true, name: true, slug: true, imageUrl: true } },
        poemTags: { include: { tag: true } },
      },
    })
    if (!poem) return null

    return { a: author, p: poem }
  } catch {
    return null
  }
}

export async function getHomePagePayload() {
  const [featured, recent, moodTags, themeTags, hero] = await Promise.all([
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
    buildHomeHero(),
  ])

  return { featured, recent, moodTags, themeTags, hero }
}
