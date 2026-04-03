// GET /api/poems/by-ids?ids=id1,id2,... — batch fetch for favorites page (order preserved)
import { prisma } from '~/server/utils/prisma'

const MAX_IDS = 100

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const raw = String(query.ids ?? '')
  if (!raw.trim()) {
    return { data: [] }
  }

  const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, MAX_IDS)
  if (!ids.length) {
    return { data: [] }
  }

  const poems = await prisma.poem.findMany({
    where: {
      id: { in: ids },
      language: 'ro',
    },
    include: {
      author: { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: {
        include: { tag: { select: { id: true, name: true, slug: true, category: true, color: true } } },
      },
    },
  })

  const byId = new Map(poems.map((p) => [p.id, p]))
  const ordered = ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => p != null)

  return { data: ordered }
})
