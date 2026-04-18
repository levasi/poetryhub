// PUT /api/poems/:slug/carousel-font — per-poem carousel settings (administrators and moderators only)
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import {
  poemCarouselSettingsSchema,
  ensurePoemCarouselFontFamily,
} from '~/utils/poemCarouselFontSettings'
import { isStaffRole } from '~/utils/roles'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const tokenUser = await requireUser(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const body = await readBody(event)
  const parsed = poemCarouselSettingsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid body',
      data: parsed.error.flatten(),
    })
  }

  const existing = await prisma.poem.findUnique({ where: { slug } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }
  /** Same rule as carousel generator UI: administrators and moderators only. */
  if (!isStaffRole(tokenUser.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const payload = { ...parsed.data }
  delete (payload as { ctaText?: string }).ctaText

  const toStore = ensurePoemCarouselFontFamily(payload)
  const json = JSON.parse(JSON.stringify(toStore)) as Prisma.InputJsonValue

  await prisma.poem.update({
    where: { slug },
    data: { carouselFontSettings: json },
  })

  return toStore
})
