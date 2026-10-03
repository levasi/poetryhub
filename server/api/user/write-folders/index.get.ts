// GET /api/user/write-folders — list folders for the Write project dropdown
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const folders = await prisma.userWriteFolder.findMany({
    where: { userId: tokenUser.id },
    orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  })
  return { data: folders }
})
