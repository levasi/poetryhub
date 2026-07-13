// GET /api/site/settings — public: header / UI flags
import { prisma } from '~/server/utils/prisma'

export default defineCachedEventHandler(
  async () => {
    const row = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
    return {
      showLanguageSwitch: row?.showLanguageSwitch ?? false,
    }
  },
  {
    name: 'api-site-settings',
    maxAge: 60,
    staleMaxAge: 120,
    swr: true,
    getKey: () => 'settings',
  },
)
