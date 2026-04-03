// GET /api/user/me
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const row = await prisma.user.findUnique({ where: { id: tokenUser.id } })
  if (!row) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt,
    hasPassword: row.passwordHash != null,
    poemFontFamily: row.poemFontFamily,
    poemFontSize: row.poemFontSize,
    poemLineHeight: row.poemLineHeight,
    poemLetterSpacing: row.poemLetterSpacing,
  }
})
