// DELETE /api/admin/users/:id — remove a registered user (admin only)
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event)
  const userId = getRouterParam(event, 'id')

  if (!userId?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  if (userId === adminUser.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (target.email.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase()) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete site owner account' })
  }

  await prisma.user.delete({ where: { id: userId } })

  return { ok: true as const }
})
