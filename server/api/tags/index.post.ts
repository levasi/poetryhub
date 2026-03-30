// POST /api/tags — create a tag (admin only)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { slugify } from '~/server/utils/slug'

const schema = z.object({
  name:     z.string().min(1).max(100),
  category: z.enum(['mood', 'theme', 'language', 'era', 'style']).default('theme'),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Validation error' })

  const { name, category, color } = parsed.data
  const slug = slugify(name)

  return prisma.tag.upsert({
    where: { slug },
    update: { category, color },
    create: { name, slug, category, color },
  })
})
