// PUT /api/poems/:slug/carousel-font — per-poem carousel settings (same auth as site carousel defaults)
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import {
  poemCarouselSettingsSchema,
  ensurePoemCarouselFontFamily,
} from '~/utils/poemCarouselFontSettings'
import { resolveCarouselDefaultsAdminEmail } from '~/utils/carouselDefaultsAdmin'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const tokenUser = await requireUser(event)
  const config = useRuntimeConfig()
  const adminEmail = resolveCarouselDefaultsAdminEmail(
    config.public.carouselDefaultsAdminEmail as string | undefined,
  )
  if (tokenUser.email.toLowerCase() !== adminEmail) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

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

  const toStore = ensurePoemCarouselFontFamily(parsed.data)
  const json = JSON.parse(JSON.stringify(toStore)) as Prisma.InputJsonValue

  const existing = await prisma.poem.findUnique({ where: { slug } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }

  await prisma.poem.update({
    where: { slug },
    data: { carouselFontSettings: json },
  })

  return toStore
})
