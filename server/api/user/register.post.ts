// POST /api/user/register
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { setCookie } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { signUserToken, USER_TOKEN_COOKIE } from '~/server/utils/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  })

  const token = await signUserToken({ id: user.id, email: user.email, name: user.name })

  setCookie(event, USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      poemFontFamily: user.poemFontFamily,
      poemFontSize: user.poemFontSize,
    },
  }
})
