// GET /api/user/favorites — returns the current user's favorited poem IDs
import { requireUser } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { poemId: true },
    orderBy: { createdAt: 'desc' },
  })

  return { ids: favorites.map((f) => f.poemId) }
})
