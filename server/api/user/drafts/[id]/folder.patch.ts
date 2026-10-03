// PATCH /api/user/drafts/:id/folder — move a draft into / out of a write folder
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  folderId: z.string().cuid().nullable(),
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

  const existing = await prisma.userPoemDraft.findFirst({
    where: { id, userId: tokenUser.id },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Draft not found' })

  let folderId: string | null = null
  if (parsed.data.folderId) {
    const folder = await prisma.userWriteFolder.findFirst({
      where: { id: parsed.data.folderId, userId: tokenUser.id },
      select: { id: true },
    })
    if (!folder) throw createError({ statusCode: 400, statusMessage: 'Invalid folder' })
    folderId = folder.id
  }

  await prisma.userPoemDraft.update({
    where: { id },
    data: { folderId },
  })

  return { ok: true, folderId }
})
