// POST /api/user/favorites/:poemId — toggle favorite for current user
import { requireUser } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const poemId = getRouterParam(event, 'poemId')!

  const existing = await prisma.favorite.findUnique({
    where: { userId_poemId: { userId: user.id, poemId } },
  })

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_poemId: { userId: user.id, poemId } },
    })
    return { favorited: false }
  }

  await prisma.favorite.create({ data: { userId: user.id, poemId } })
  return { favorited: true }
})
