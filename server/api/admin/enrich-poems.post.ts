/**
 * POST /api/admin/enrich-poems
 * Admin-only: runs one batch of poem date enrichment.
 *
 * Body (JSON, all optional):
 *   batchSize  – number of poems to process per call (default 5, max 20)
 *   force      – if true, re-enrich even poems that already have writtenDateEnrichedAt set
 *
 * Returns:
 *   { processed, enriched, remaining, done }
 */
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { enrichPoemWrittenDateIfNeeded } from '~/server/utils/enrichPoemWrittenDate'
import { z } from 'zod'

const bodySchema = z.object({
  batchSize: z.number().int().min(1).max(20).default(5),
  force: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawBody = await readBody(event).catch(() => ({}))
  const { batchSize, force } = bodySchema.parse(rawBody ?? {})

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim() || undefined

  // Find poems that need enrichment
  const whereClause = force
    ? {} // all poems
    : { writtenDateEnrichedAt: null }

  const poems = await prisma.poem.findMany({
    where: whereClause,
    select: { id: true },
    take: batchSize,
    orderBy: { createdAt: 'asc' },
  })

  // Count remaining BEFORE processing so we can tell the caller if there's more
  const totalRemaining = await prisma.poem.count({ where: whereClause })

  let enriched = 0
  const errors: string[] = []

  for (const poem of poems) {
    try {
      // Temporarily clear writtenDateEnrichedAt if force so the util runs again
      if (force) {
        await prisma.poem.update({
          where: { id: poem.id },
          data: { writtenDateEnrichedAt: null },
        })
      }
      await enrichPoemWrittenDateIfNeeded(poem.id, { anthropicApiKey })
      enriched++
    } catch (err) {
      errors.push(poem.id)
    }
  }

  // Remaining count AFTER processing
  const remaining = await prisma.poem.count({
    where: { writtenDateEnrichedAt: null },
  })

  return {
    processed: poems.length,
    enriched,
    errors: errors.length,
    remaining,
    done: remaining === 0,
  }
})
