/**
 * Single server-side payload for the homepage — one DB/API round-trip from the client.
 */
import { prisma } from '~/server/utils/prisma'
import { withResolvedAuthorPortrait } from '~/server/utils/authorPortrait'
import { ensureAuthorBio } from '~/server/utils/authorBio'

const poemListInclude = {
  author: { select: { id: true, name: true, slug: true, imageUrl: true } },
  poemTags: {
    include: { tag: { select: { id: true, name: true, slug: true, category: true, color: true } } },
  },
} as const

async function buildHomeHero() {
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT a.id FROM "Author" a
      WHERE EXISTS (SELECT 1 FROM "Poem" p WHERE p."authorId" = a.id AND p.language = 'ro')
      ORDER BY RANDOM()
      LIMIT 1
    `
    if (!rows.length) return null

    const raw = await prisma.author.findUnique({
      where: { id: rows[0].id },
      include: { _count: { select: { poems: true } } },
    })
    if (!raw) return null

    let author = await withResolvedAuthorPortrait(raw)
    const bioText = await ensureAuthorBio(author)
    if (bioText && bioText !== author.bio) author = { ...author, bio: bioText }

    const works = await prisma.poem.findMany({
      where: { authorId: author.id, language: 'ro' },
      select: { title: true, slug: true },
      orderBy: { title: 'asc' },
    })

    const a = { ...author, works }

    const whereFilter = { language: 'ro' as const, author: { slug: author.slug } }
    const count = await prisma.poem.count({ where: whereFilter })
    if (count === 0) return null

    const skip = Math.floor(Math.random() * count)
    const poem = await prisma.poem.findFirst({
      where: whereFilter,
      skip,
      orderBy: { id: 'asc' },
      include: {
        author: { select: { id: true, name: true, slug: true, imageUrl: true } },
        poemTags: { include: { tag: true } },
      },
    })
    if (!poem) return null

    const resolvedAuthor = await withResolvedAuthorPortrait(poem.author)
    const p = { ...poem, author: resolvedAuthor }

    return { a, p }
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
