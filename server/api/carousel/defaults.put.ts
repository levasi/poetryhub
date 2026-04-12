// PUT /api/carousel/defaults — staff or site owner (user JWT); last-slide CTA only editable by site owner
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'
import { getUserOrAdminFromEvent } from '~/server/utils/auth'
import {
  carouselSiteDefaultsSchema,
  ensureCarouselFontFamily,
  getDefaultCarouselSiteDefaults,
  parseCarouselSiteDefaults,
  type CarouselSiteDefaultsPayload,
} from '~/utils/carouselSiteDefaults'
import {
  isCarouselSiteOwnerEmail,
  userCanManageCarouselDefaults,
} from '~/utils/carouselDefaultsAdmin'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const tokenUser = await getUserOrAdminFromEvent(event)
  if (!tokenUser) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const config = useRuntimeConfig()
  const runtimeEmail = config.public.carouselDefaultsAdminEmail as string | undefined
  if (!userCanManageCarouselDefaults(tokenUser, runtimeEmail)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const existingRow = await prisma.carouselSiteDefaults.findUnique({ where: { id: 'singleton' } })
  const prev: CarouselSiteDefaultsPayload = existingRow?.config
    ? parseCarouselSiteDefaults(existingRow.config)
    : getDefaultCarouselSiteDefaults()

  const body = await readBody(event)
  const parsed = carouselSiteDefaultsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid body',
      data: parsed.error.flatten(),
    })
  }

  let merged: CarouselSiteDefaultsPayload = { ...(parsed.data as CarouselSiteDefaultsPayload) }
  if (!isCarouselSiteOwnerEmail(tokenUser.email, runtimeEmail)) {
    merged = { ...merged, ctaText: prev.ctaText }
  }

  const toStore = ensureCarouselFontFamily(merged)
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
