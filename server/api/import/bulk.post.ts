// POST /api/import/bulk — import poems from JSON payload (admin only)
// Accepts array of poem objects: { title, content, author, language?, tags? }
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { slugify, uniqueSlug, estimateReadingTime, extractExcerpt } from '~/server/utils/slug'

const poemSchema = z.object({
  title:    z.string().min(1),
  content:  z.string().min(1),
  author:   z.string().min(1),
  language: z.string().default('en'),
  source:   z.string().default('classic'),
  tags:     z.array(z.string()).default([]),
})

const bodySchema = z.array(poemSchema).min(1).max(500)

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body   = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid bulk payload', data: parsed.error.flatten() })
  }

  let imported = 0
  let skipped  = 0
  const errors: string[] = []

  for (const item of parsed.data) {
    try {
      // Upsert author
      const authorSlug = slugify(item.author)
      let author = await prisma.author.findUnique({ where: { slug: authorSlug } })
      if (!author) {
        author = await prisma.author.create({ data: { name: item.author, slug: authorSlug } })
      }

      // Duplicate check
      const dup = await prisma.poem.findFirst({ where: { title: item.title, authorId: author.id } })
      if (dup) { skipped++; continue }

      // Build slug
      let poemSlug = slugify(item.title)
      const slugExists = await prisma.poem.findUnique({ where: { slug: poemSlug } })
      if (slugExists) poemSlug = uniqueSlug(item.title)

      // Upsert tags and collect IDs
      const tagIds: string[] = []
      for (const tagName of item.tags) {
        const tagSlug = slugify(tagName)
        const tag = await prisma.tag.upsert({
          where:  { slug: tagSlug },
          update: {},
          create: { name: tagName, slug: tagSlug },
        })
        tagIds.push(tag.id)
      }

      await prisma.poem.create({
        data: {
          title:       item.title,
          slug:        poemSlug,
          content:     item.content,
          excerpt:     extractExcerpt(item.content),
          readingTime: estimateReadingTime(item.content),
          authorId:    author.id,
          language:    item.language,
          source:      item.source,
          poemTags:    { create: tagIds.map((tagId) => ({ tagId })) },
        },
      })

      imported++
    } catch (err) {
      errors.push(`${item.title}: ${String(err)}`)
    }
  }

  await prisma.importLog.create({
    data: {
      source:   'bulk-json',
      status:   errors.length === 0 ? 'success' : 'partial',
      imported,
      skipped,
      errors:   errors.length,
      details:  errors.length > 0 ? errors.join('\n') : null,
    },
  })

  return { ok: true, imported, skipped, errors: errors.length, errorDetails: errors }
})
