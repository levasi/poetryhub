// DELETE /api/user/me — permanently delete own account (password required)
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { deleteCookie } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { requireUser, USER_TOKEN_COOKIE } from '~/server/utils/auth'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

const schema = z.object({
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)

  if (tokenUser.email.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Site owner account cannot be deleted here',
    })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Password required' })
  }

  const user = await prisma.user.findUnique({ where: { id: tokenUser.id } })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (user.passwordHash) {
    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!ok) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
    }
  } else {
    const typed = parsed.data.password.trim().toLowerCase()
    if (typed !== user.email.toLowerCase()) {
      throw createError({ statusCode: 401, statusMessage: 'Email does not match' })
    }
  }

  await prisma.user.delete({ where: { id: user.id } })

  deleteCookie(event, USER_TOKEN_COOKIE, { path: '/' })

  return { ok: true as const }
})
