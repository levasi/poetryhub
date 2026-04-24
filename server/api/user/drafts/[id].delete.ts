// DELETE /api/user/drafts/:id — delete a draft
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const d = await prisma.userPoemDraft.findFirst({ where: { id, userId: tokenUser.id }, select: { id: true } })
  if (!d) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })

  await prisma.userPoemDraft.delete({ where: { id } })
  return { ok: true }
})

