import { slugify } from '~/utils/slug'
import { prisma } from '~/server/utils/prisma'

export { slugify, foldSlugDiacritics } from '~/utils/slug'

/** Append a short random suffix to ensure uniqueness when needed. */
export function uniqueSlug(text: string): string {
  const base = slugify(text)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'item'}-${suffix}`
}

/**
 * Pick a per-user unique draft slug from a title (`base`, `base-2`, …).
 * Pass `excludeId` when updating so the draft can keep its current slug.
 */
export async function ensureUniqueDraftSlug(
  userId: string,
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title) || 'proiect'
  const rows = await prisma.userPoemDraft.findMany({
    where: {
      userId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  })
  const taken = new Set(rows.map((r) => r.slug).filter(Boolean))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Estimate reading time in seconds (average 200 wpm). */
export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil((words / 200) * 60)
}

/** Extract excerpt: first N non-empty lines. */
export function extractExcerpt(content: string, lines = 2): string {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join('\n')
}
