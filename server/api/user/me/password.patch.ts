// PATCH /api/user/me/password — change password (requires current password)
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: tokenUser.id } })

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)

  await prisma.user.update({
    where: { id: tokenUser.id },
    data: { passwordHash },
  })

  return { ok: true }
})
