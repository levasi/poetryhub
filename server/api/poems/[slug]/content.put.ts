// PUT /api/poems/:slug/content — update poem body (carousel owner email only; not admin JWT)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { estimateReadingTime, extractExcerpt } from '~/server/utils/slug'
import { userCanManageCarouselDefaults } from '~/utils/carouselDefaultsAdmin'

const schema = z.object({
  content: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const tokenUser = await requireUser(event)
  const config = useRuntimeConfig()
  if (
    !userCanManageCarouselDefaults(tokenUser, config.public.carouselDefaultsAdminEmail as string | undefined)
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const slug = getRouterParam(event, 'slug')
  if (!slug?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
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

  const content = parsed.data.content
  await prisma.poem.update({
    where: { slug },
    data: {
      content,
      excerpt: extractExcerpt(content),
      readingTime: estimateReadingTime(content),
    },
  })

  return { ok: true as const }
})
