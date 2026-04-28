/**
 * Backfill `synonymsJson` / `antonymsJson` for `WriteLexiconWord` using ro.wiktionary extracts.
 *
 * Usage:
 *   npx tsx scripts/backfill-wiktionary-relations.ts --dry-run
 *   npx tsx scripts/backfill-wiktionary-relations.ts --limit 500
 *   npx tsx scripts/backfill-wiktionary-relations.ts --resume-from word
 *
 * Notes:
 * - This is best-effort parsing; Wiktionary structure is not guaranteed.
 * - Only updates rows where the target field is currently empty (`[]`).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { fetchWiktionaryRoRelations } from '../server/utils/wiktionaryRo'

type Args = {
  dryRun: boolean
  limit: number
  resumeFrom: string | null
  sleepMs: number
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, limit: 0, resumeFrom: null, sleepMs: 220 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--limit') out.limit = Math.max(0, Number(argv[++i] ?? 0) || 0)
    else if (a === '--resume-from') out.resumeFrom = String(argv[++i] ?? '').trim() || null
    else if (a === '--sleep-ms') out.sleepMs = Math.max(0, Number(argv[++i] ?? 0) || 0)
  }
  return out
}

function safeParseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw) as unknown
    return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : []
  } catch {
    return []
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const prisma = new PrismaClient()

  let scanned = 0
  let updated = 0
  let updatedSyn = 0
  let updatedAnt = 0
  let skippedHasData = 0
  let skippedNoRelations = 0
  let failed = 0

  try {
    const rows = await prisma.writeLexiconWord.findMany({
      select: { id: true, word: true, synonymsJson: true, antonymsJson: true },
      orderBy: { word: 'asc' },
    })

    const startIdx =
      args.resumeFrom == null
        ? 0
        : Math.max(
            0,
            rows.findIndex((r) => r.word === args.resumeFrom),
          )

    const slice = args.limit > 0 ? rows.slice(startIdx, startIdx + args.limit) : rows.slice(startIdx)

    console.log(
      `[wiktionary-rel] plan: rows=${rows.length}, start=${startIdx}, run=${slice.length}, dryRun=${args.dryRun}`,
    )

    for (const r of slice) {
      scanned++
      const syn = safeParseJsonArray(r.synonymsJson)
      const ant = safeParseJsonArray(r.antonymsJson)
      const needsSyn = syn.length === 0
      const needsAnt = ant.length === 0
      if (!needsSyn && !needsAnt) {
        skippedHasData++
        continue
      }

      const rel = await fetchWiktionaryRoRelations(r.word)
      await sleep(args.sleepMs)

      if (!rel) {
        skippedNoRelations++
        continue
      }

      const nextSyn = needsSyn ? rel.synonyms : syn
      const nextAnt = needsAnt ? rel.antonyms : ant

      if ((!needsSyn || nextSyn.length === 0) && (!needsAnt || nextAnt.length === 0)) {
        skippedNoRelations++
        continue
      }

      if (!args.dryRun) {
        await prisma.writeLexiconWord.update({
          where: { id: r.id },
          data: {
            ...(needsSyn ? { synonymsJson: JSON.stringify(nextSyn) } : {}),
            ...(needsAnt ? { antonymsJson: JSON.stringify(nextAnt) } : {}),
          },
        })
      }

      updated++
      if (needsSyn && nextSyn.length) updatedSyn++
      if (needsAnt && nextAnt.length) updatedAnt++

      if (updated % 50 === 0) {
        console.log(
          `[wiktionary-rel] progress: scanned=${scanned}, updated=${updated} (syn=${updatedSyn}, ant=${updatedAnt}), resumeFrom=${r.word}`,
        )
      }
    }

    console.log(
      `[wiktionary-rel] done: scanned=${scanned}, updated=${updated} (syn=${updatedSyn}, ant=${updatedAnt}), skippedHasData=${skippedHasData}, skippedNoRelations=${skippedNoRelations}, failed=${failed}`,
    )
  } catch (e) {
    failed++
    console.error(e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
