// PUT /api/site/settings — admin / staff only
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

const bodySchema = z.object({
  showLanguageSwitch: z.boolean(),
})

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  await requireAdmin(event)
  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }
  const { showLanguageSwitch } = parsed.data

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', showLanguageSwitch },
    update: { showLanguageSwitch },
  })

  return { showLanguageSwitch }
})
