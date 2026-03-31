// GET /api/carousel/defaults — public: site-wide carousel style defaults
import { prisma } from '~/server/utils/prisma'
import {
  getDefaultCarouselSiteDefaults,
  parseCarouselSiteDefaults,
} from '~/utils/carouselSiteDefaults'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const row = await prisma.carouselSiteDefaults.findUnique({ where: { id: 'singleton' } })
  const config = row?.config != null ? parseCarouselSiteDefaults(row.config) : getDefaultCarouselSiteDefaults()
  return config
})
