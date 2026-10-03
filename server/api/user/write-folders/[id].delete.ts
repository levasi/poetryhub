// DELETE /api/user/write-folders/:id — delete folder; drafts become unfiled
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const existing = await prisma.userWriteFolder.findFirst({
    where: { id, userId: tokenUser.id },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Folder not found' })

  await prisma.userWriteFolder.delete({ where: { id } })
  return { ok: true }
})
