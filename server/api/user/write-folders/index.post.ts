// POST /api/user/write-folders — create a Write project folder
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  name: z.string().trim().min(1).max(80),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const folder = await prisma.userWriteFolder.create({
    data: {
      userId: tokenUser.id,
      name: parsed.data.name,
    },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  })

  return folder
})
