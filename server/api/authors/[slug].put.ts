// PUT /api/authors/:slug — admin JWT, or editor / moderator / admin / site owner (app session).
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuthorCatalogEditor } from '~/server/utils/auth'

const schema = z.object({
  name:        z.string().min(1).max(200).optional(),
  bio:         z.string().optional(),
  birthYear:   z.number().int().optional().nullable(),
  deathYear:   z.number().int().optional().nullable(),
  nationality: z.string().optional(),
  imageUrl:    z.string().url().optional().or(z.literal('')),
})

export default defineEventHandler(async (event) => {
  await requireAuthorCatalogEditor(event)
  const slug   = getRouterParam(event, 'slug')!
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error', data: parsed.error.flatten() })
  }

  const existing = await prisma.author.findUnique({ where: { slug } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Author not found' })

  return prisma.author.update({
    where: { slug },
    data: { ...parsed.data, imageUrl: parsed.data.imageUrl || null },
  })
})
