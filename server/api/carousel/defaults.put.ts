// PUT /api/carousel/defaults — only the configured admin email may persist site defaults
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import {
  carouselSiteDefaultsSchema,
  ensureCarouselFontFamily,
  type CarouselSiteDefaultsPayload,
} from '~/utils/carouselSiteDefaults'
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

  const body = await readBody(event)
  const parsed = carouselSiteDefaultsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid body',
      data: parsed.error.flatten(),
    })
  }

  const toStore = ensureCarouselFontFamily(parsed.data as CarouselSiteDefaultsPayload)
  const configJson = JSON.parse(JSON.stringify(toStore)) as Prisma.InputJsonValue

  await prisma.carouselSiteDefaults.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      config: configJson,
      updatedBy: tokenUser.email,
    },
    update: {
      config: configJson,
      updatedBy: tokenUser.email,
    },
  })

  return toStore
})
