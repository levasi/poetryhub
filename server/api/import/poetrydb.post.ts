// POST /api/import/poetrydb — bulk import from PoetryDB API (admin only)
// PoetryDB docs: https://poetrydb.org/
// Body: { authors?: string[], count?: number }
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { slugify, uniqueSlug, estimateReadingTime, extractExcerpt } from '~/server/utils/slug'

interface PoetryDBPoem {
  title:   string
  author:  string
  lines:   string[]
  linecount: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const config = useRuntimeConfig()
  const body   = await readBody(event)

  const targetAuthors: string[] = body?.authors ?? []
  const count = Math.min(body?.count ?? 20, 100)

  let url: string
  if (targetAuthors.length > 0) {
    // Fetch by specific author(s)
    url = `${config.poetryDbUrl}/author/${encodeURIComponent(targetAuthors[0])}`
  } else {
    // Fetch random poems
    url = `${config.poetryDbUrl}/random/${count}`
  }

  let poems: PoetryDBPoem[]
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`PoetryDB returned ${res.status}`)
    poems = await res.json()
    // PoetryDB returns 404 object when not found
    if (!Array.isArray(poems)) throw new Error('Unexpected response from PoetryDB')
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: `PoetryDB fetch failed: ${String(err)}` })
  }

  let imported = 0
  let skipped  = 0
  const errors: string[] = []

  for (const raw of poems.slice(0, count)) {
    try {
      const content = raw.lines.join('\n').trim()
      if (!content) { skipped++; continue }

      // Upsert author
      const authorSlug = slugify(raw.author)
      let author = await prisma.author.findUnique({ where: { slug: authorSlug } })
      if (!author) {
        author = await prisma.author.create({
          data: { name: raw.author, slug: authorSlug, nationality: 'Unknown' },
        })
      }

      // Check duplicate by title + authorId
      const existing = await prisma.poem.findFirst({
        where: { title: raw.title, authorId: author.id },
      })
      if (existing) { skipped++; continue }

      // Build slug
      let poemSlug = slugify(raw.title)
      const slugExists = await prisma.poem.findUnique({ where: { slug: poemSlug } })
      if (slugExists) poemSlug = uniqueSlug(raw.title)

      await prisma.poem.create({
        data: {
          title:       raw.title,
          slug:        poemSlug,
          content,
          excerpt:     extractExcerpt(content),
          readingTime: estimateReadingTime(content),
          authorId:    author.id,
          language:    'en',
          source:      'imported',
          sourceUrl:   `https://poetrydb.org/title/${encodeURIComponent(raw.title)}`,
        },
      })

      imported++
    } catch (err) {
      errors.push(`${raw.title}: ${String(err)}`)
    }
  }

  // Log the import run
  await prisma.importLog.create({
    data: {
      source:   'poetrydb',
      status:   errors.length === 0 ? 'success' : 'partial',
      imported,
      skipped,
      errors:   errors.length,
      details:  errors.length > 0 ? errors.join('\n') : null,
    },
  })

  return { ok: true, imported, skipped, errors: errors.length, errorDetails: errors }
})
