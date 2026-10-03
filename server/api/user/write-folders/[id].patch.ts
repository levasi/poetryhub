// PATCH /api/user/write-folders/:id — rename a Write project folder
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  name: z.string().trim().min(1).max(80),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const existing = await prisma.userWriteFolder.findFirst({
    where: { id, userId: tokenUser.id },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Folder not found' })

  return prisma.userWriteFolder.update({
    where: { id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  })
})
