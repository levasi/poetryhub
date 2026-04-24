/**
 * Applies curated DOM (differential object marking) definitions from
 * `data/lexicon/domDefinitions.ts` to `WriteLexiconWord.definition`.
 *
 * Run after lexicon import: `npm run write:lexicon && npm run write:dom-definitions`
 *
 * Skips lemmas missing from the DB (not an error). Idempotent for same dataset.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { DOM_LEXICON_DEFINITIONS } from '../data/lexicon/domDefinitions'

const prisma = new PrismaClient()

async function main() {
  let updated = 0
  let skippedMissing = 0

  for (const { word, definition } of DOM_LEXICON_DEFINITIONS) {
    const row = await prisma.writeLexiconWord.findUnique({
      where: { word },
      select: { id: true },
    })
    if (!row) {
      skippedMissing++
      console.warn(`[dom-definitions] skip (not in lexicon): ${word}`)
      continue
    }
    await prisma.writeLexiconWord.update({
      where: { word },
      data: { definition },
    })
    updated++
  }

  console.log(`[dom-definitions] updated ${updated}, skipped missing ${skippedMissing}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
