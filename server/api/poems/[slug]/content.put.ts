// PUT /api/poems/:slug/content — update poem body and/or title (editor, moderator, admin)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { invalidateAuthorDetailCaches, invalidatePoemCaches } from '~/server/utils/invalidatePublicCache'
import { estimateReadingTime, extractExcerpt } from '~/server/utils/slug'
import { isPoemEditorRole, isSiteOwnerEmail } from '~/utils/roles'

const schema = z
  .object({
    content: z.string().min(1).optional(),
    title: z.string().min(1).max(500).optional(),
  })
  .strict()
  .refine((d) => d.content !== undefined || d.title !== undefined, {
    message: 'Provide content and/or title',
  })

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const tokenUser = await requireUser(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid body',
      data: parsed.error.flatten(),
    })
  }

  const existing = await prisma.poem.findUnique({
    where: { slug },
    select: {
      id: true,
      authorId: true,
      author: { select: { slug: true } },
    },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }
  if (!isPoemEditorRole(tokenUser.role) && !isSiteOwnerEmail(tokenUser.email)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only editors, moderators and admins can edit poem text',
    })
  }

  const { content, title } = parsed.data

  if (title !== undefined) {
    const titleTrim = title.trim()
    if (!titleTrim.length) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid title' })
    }
    const dup = await prisma.poem.findFirst({
      where: {
        authorId: existing.authorId,
        title: { equals: titleTrim, mode: 'insensitive' },
        NOT: { id: existing.id },
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
  }

  await prisma.poem.update({
    where: { slug },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(content !== undefined
        ? {
            content,
            excerpt: extractExcerpt(content),
            readingTime: estimateReadingTime(content),
          }
        : {}),
    },
  })

  await invalidatePoemCaches(slug)
  const authorSlug = existing.author?.slug
  if (authorSlug) await invalidateAuthorDetailCaches(authorSlug)

  return { ok: true as const }
})
