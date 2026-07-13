// GET /api/carousel/defaults — public: site-wide carousel style defaults
import { prisma } from '~/server/utils/prisma'
import {
  getDefaultCarouselSiteDefaults,
  parseCarouselSiteDefaults,
} from '~/utils/carouselSiteDefaults'

export default defineCachedEventHandler(
  async () => {
    const row = await prisma.carouselSiteDefaults.findUnique({ where: { id: 'singleton' } })
    return row?.config != null
      ? parseCarouselSiteDefaults(row.config)
      : getDefaultCarouselSiteDefaults()
  },
  {
    name: 'api-carousel-defaults',
    maxAge: 300,
    staleMaxAge: 600,
    swr: true,
    getKey: () => 'defaults',
  },
)
