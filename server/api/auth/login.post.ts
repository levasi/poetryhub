// POST /api/auth/login
// Admin panel: User with role admin, or legacy AdminUser row
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { setCookie } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { signAdminToken, TOKEN_COOKIE } from '~/server/utils/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { email, password } = parsed.data

  // 1) Account with role admin (same password as /api/user/login)
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }
    if (user.role !== 'admin') {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }

    const token = await signAdminToken({ id: user.id, email: user.email })

    setCookie(event, TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return { ok: true, user: { id: user.id, email: user.email, name: user.name, role: 'admin' as const } }
  }

  // 2) Legacy AdminUser (seed / env)
  const adminUser = await prisma.adminUser.findUnique({ where: { email } })
  if (!adminUser) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, adminUser.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await signAdminToken({ id: adminUser.id, email: adminUser.email })

  setCookie(event, TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { ok: true, user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: 'admin' as const } }
})
