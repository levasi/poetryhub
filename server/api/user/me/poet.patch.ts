// PATCH /api/user/me/poet — toggle poet account flag
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  isPoet: z.boolean(),
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
    data: { isPoet: parsed.data.isPoet },
    select: { id: true, isPoet: true },
  })

  return updated
})

