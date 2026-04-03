// POST /api/user/poems — submit a poem as a logged-in user
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { slugify, uniqueSlug, estimateReadingTime, extractExcerpt } from '~/server/utils/slug'

const schema = z.object({
  title:      z.string().min(1).max(500).trim(),
  content:    z.string().min(1).trim(),
  authorName: z.string().min(1).max(80).trim(),
  language:   z.string().default('en'),
  tagIds:     z.array(z.string()).default([]),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error', data: parsed.error.flatten() })
  }

  const { title, content, authorName, language, tagIds } = parsed.data

  // Find or create an Author by name for this user
  const authorSlug = slugify(authorName)
  let author = await prisma.author.findUnique({ where: { slug: authorSlug } })
  if (!author) {
    author = await prisma.author.create({
      data: { name: authorName, slug: authorSlug },
    })
  }

  // Generate unique slug for the poem
  let slug = slugify(title)
  const existing = await prisma.poem.findUnique({ where: { slug } })
  if (existing) slug = uniqueSlug(title)

  const poem = await prisma.poem.create({
    data: {
      title,
      slug,
      content,
      excerpt: extractExcerpt(content),
      readingTime: estimateReadingTime(content),
      authorId: author.id,
      language,
      source: 'user-submitted',
      submittedByUserId: tokenUser.id,
      poemTags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: {
      author:   { select: { id: true, name: true, slug: true } },
      poemTags: { include: { tag: true } },
    },
  })

  return poem
})
