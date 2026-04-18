// PUT /api/authors/:slug — admin JWT, or editor / moderator / admin / site owner (app session).
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuthorCatalogEditor } from '~/server/utils/auth'
import { invalidateAuthorDetailCaches } from '~/server/utils/invalidatePublicCache'

const MAX_IMAGE_URL_CHARS = 15_000_000

function isValidPortraitUrl(s: string): boolean {
  const t = s.trim()
  if (!t) return true
  if (/^data:image\//i.test(t)) {
    return t.length <= MAX_IMAGE_URL_CHARS
  }
  try {
    const u = new URL(t)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const schema = z.object({
  name:        z.string().min(1).max(200).optional(),
  bio:         z.string().optional(),
  birthYear:   z.number().int().optional().nullable(),
  deathYear:   z.number().int().optional().nullable(),
  nationality: z.string().optional(),
  /** HTTPS URL or `data:image/*;base64,…` from admin portrait upload */
  imageUrl:    z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuthorCatalogEditor(event)
  const slug   = getRouterParam(event, 'slug')!
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error', data: parsed.error.flatten() })
  }

  const rawImg = parsed.data.imageUrl?.trim() ?? ''
  if (rawImg && !isValidPortraitUrl(rawImg)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid portrait URL' })
  }

  const existing = await prisma.author.findUnique({ where: { slug } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Author not found' })

  const updated = await prisma.author.update({
    where: { slug },
    data: { ...parsed.data, imageUrl: rawImg || null },
  })

  await invalidateAuthorDetailCaches(slug)

  return updated
})
