// PUT /api/poems/:slug — update a poem (admin only)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { invalidatePoemCaches } from '~/server/utils/invalidatePublicCache'
import { estimateReadingTime, extractExcerpt } from '~/server/utils/slug'

const schema = z.object({
  title:     z.string().min(1).max(500).optional(),
  content:   z.string().min(1).optional(),
  authorId:  z.string().optional(),
  language:  z.string().optional(),
  source:    z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  featured:  z.boolean().optional(),
  tagIds:    z.array(z.string()).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const slug   = getRouterParam(event, 'slug')!
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error', data: parsed.error.flatten() })
  }

  const existing = await prisma.poem.findUnique({ where: { slug } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Poem not found' })

  const { tagIds, content, ...rest } = parsed.data

  const poem = await prisma.poem.update({
    where: { slug },
    data: {
      ...rest,
      ...(content && {
        content,
        excerpt: extractExcerpt(content),
        readingTime: estimateReadingTime(content),
      }),
      sourceUrl: rest.sourceUrl || null,
      // Replace tag associations if provided
      ...(tagIds !== undefined && {
        poemTags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
    include: {
      author:   { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } },
    },
  })

  await invalidatePoemCaches(slug)

  return poem
})
