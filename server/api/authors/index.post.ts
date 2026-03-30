// POST /api/authors — create author (admin only)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { slugify, uniqueSlug } from '~/server/utils/slug'

const schema = z.object({
  name:        z.string().min(1).max(200),
  bio:         z.string().optional(),
  birthYear:   z.number().int().optional(),
  deathYear:   z.number().int().optional(),
  nationality: z.string().optional(),
  imageUrl:    z.string().url().optional().or(z.literal('')),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error', data: parsed.error.flatten() })
  }

  const data = parsed.data
  let slug = slugify(data.name)
  const existing = await prisma.author.findUnique({ where: { slug } })
  if (existing) slug = uniqueSlug(data.name)

  return prisma.author.create({
    data: { ...data, slug, imageUrl: data.imageUrl || null },
  })
})
