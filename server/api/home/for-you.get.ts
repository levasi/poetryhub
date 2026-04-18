// GET /api/home/for-you — “For you” feed (Romanian poems, randomized; supports exclusion)
import { prisma } from '~/server/utils/prisma'
import { poemListInclude } from '~/server/utils/homePagePayload'

function toInt(v: unknown, fallback: number) {
  const n = parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function parseExcludeIds(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String).flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean)
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const limit = Math.min(50, Math.max(1, toInt(q.limit, 5)))
  const excludeIds = parseExcludeIds(q.exclude)
  const seed = toInt(q.seed, Date.now())

  const where = {
    language: 'ro' as const,
    ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
  }

  // We can't do ORDER BY RANDOM() portably in Prisma across DBs, so:
  // take a decently sized "pool" (newest-first), then shuffle in memory with a seed.
  const poolSize = Math.min(500, Math.max(limit * 40, 120))

  const [pool, totalRemaining] = await Promise.all([
    prisma.poem.findMany({
      where,
      take: poolSize,
      orderBy: { publishedAt: 'desc' },
      include: poemListInclude,
    }),
    prisma.poem.count({ where }),
  ])

  const rng = mulberry32(seed)
  const shuffled = pool
    .map((p) => ({ p, r: rng() }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p)

  const data = shuffled.slice(0, limit)

  return {
    data,
    meta: {
      limit,
      total: totalRemaining,
      exclude: excludeIds.length,
      hasMore: totalRemaining > data.length,
    },
  }
})
