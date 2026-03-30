// POST /api/auth/login
// Authenticates an admin user and sets a JWT cookie
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

  // Look up admin user
  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await signAdminToken({ id: user.id, email: user.email })

  // HttpOnly cookie — 7 days
  setCookie(event, TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { ok: true, user: { id: user.id, email: user.email, name: user.name } }
})
