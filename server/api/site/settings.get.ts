// GET /api/site/settings — public: header / UI flags (cached briefly at CDN edge if you add headers)
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=120')
  const row = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
  return {
    showLanguageSwitch: row?.showLanguageSwitch ?? false,
  }
})
