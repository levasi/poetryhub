// POST /api/poems — create a new poem (admin only)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { slugify, uniqueSlug, estimateReadingTime, extractExcerpt } from '~/server/utils/slug'

const schema = z.object({
  title:    z.string().min(1).max(500),
  content:  z.string().min(1),
  authorId: z.string().min(1),
  language: z.string().default('en'),
  source:   z.string().default('classic'),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  tagIds:   z.array(z.string()).default([]),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: parsed.error.flatten(),
    })
  }

  const { tagIds, ...data } = parsed.data

  // Generate a unique slug from the title
  let slug = slugify(data.title)
  const existing = await prisma.poem.findUnique({ where: { slug } })
  if (existing) slug = uniqueSlug(data.title)

  const poem = await prisma.poem.create({
    data: {
      ...data,
      slug,
      sourceUrl: data.sourceUrl || null,
      excerpt: extractExcerpt(data.content),
      readingTime: estimateReadingTime(data.content),
      poemTags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: {
      author:   { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } },
    },
  })

  return poem
})
