// PATCH /api/admin/users/[id]/role — update a user's role (admin panel only)
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

const schema = z.object({
  role: z.enum(['user', 'editor', 'moderator', 'admin']),
})

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event)
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  if (userId === adminUser.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot change your own role' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (target.email.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase() && parsed.data.role !== 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot change site owner role' })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true },
  })

  return updated
})
