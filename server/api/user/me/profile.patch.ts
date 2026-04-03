// PATCH /api/user/me/profile — update display name
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  name: z.string().min(1).max(80).trim(),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }

  const updated = await prisma.user.update({
    where: { id: tokenUser.id },
    data: { name: parsed.data.name },
    select: { id: true, email: true, name: true, role: true },
  })

  return updated
})
