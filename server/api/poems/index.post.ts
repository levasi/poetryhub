// POST /api/poems — create poem (admin JWT; app users: editor / moderator / admin / site owner)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuthorCatalogEditor } from '~/server/utils/auth'
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
  const actor = await requireAuthorCatalogEditor(event)
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

  const titleTrimmed = data.title.trim()
  if (!titleTrimmed) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error', data: { title: ['Title cannot be empty'] } })
  }

  const dup = await prisma.poem.findFirst({
    where: {
      authorId: data.authorId,
      title: { equals: titleTrimmed, mode: 'insensitive' },
    },
    select: { id: true },
  })
  if (dup) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Duplicate poem title for this author',
      data: { code: 'DUPLICATE_POEM_TITLE' },
    })
  }

  // Generate a unique slug from the title (global uniqueness; avoids URL collisions only)
  let slug = slugify(titleTrimmed)
  const existingSlug = await prisma.poem.findUnique({ where: { slug } })
  if (existingSlug) slug = uniqueSlug(titleTrimmed)

  const contentTrimmed = data.content.trim()
  if (!contentTrimmed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: { content: ['Content cannot be empty'] },
    })
  }

  const submitter =
    (await prisma.user.findUnique({ where: { id: actor.id }, select: { id: true } })) ??
    (await prisma.user.findUnique({ where: { email: actor.email }, select: { id: true } }))

  const poem = await prisma.poem.create({
    data: {
      ...data,
      title: titleTrimmed,
      content: contentTrimmed,
      slug,
      sourceUrl: data.sourceUrl || null,
      excerpt: extractExcerpt(contentTrimmed),
      readingTime: estimateReadingTime(contentTrimmed),
      /**
       * Ensure poems created via the catalog editor APIs show up under Account → “My poems”.
       * Admin tokens may not map to a `User` row in some environments, so guard the FK.
       */
      submittedByUserId: submitter?.id,
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
