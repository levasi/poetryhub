/**
 * Backfill UserPoemDraft.slug with unique per-user title slugs.
 *
 * After schema push / migration:
 *   npx tsx scripts/backfill-draft-slugs.ts
 */
import { PrismaClient } from '@prisma/client'
import { slugify } from '../utils/slug'

const prisma = new PrismaClient()

function nextSlug(title: string, taken: Set<string>): string {
  const base = slugify(title) || 'proiect'
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  const slug = `${base}-${n}`
  taken.add(slug)
  return slug
}

async function main() {
  const drafts = await prisma.userPoemDraft.findMany({
    select: { id: true, userId: true, title: true, slug: true },
    orderBy: { createdAt: 'asc' },
  })

  const byUser = new Map<string, typeof drafts>()
  for (const d of drafts) {
    const list = byUser.get(d.userId) ?? []
    list.push(d)
    byUser.set(d.userId, list)
  }

  let updated = 0
  for (const [, list] of byUser) {
    const taken = new Set<string>()
    for (const d of list) {
      const slug = nextSlug(d.title || 'Proiect', taken)
      if (slug !== d.slug) {
        await prisma.userPoemDraft.update({
          where: { id: d.id },
          data: { slug },
        })
        updated++
      }
    }
  }

  console.log(`Updated ${updated} draft slug(s); scanned ${drafts.length}.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
