/**
 * Copiază lexiconul din baza SQLite rhymescheme (`Word`, `CachedLookup`)
 * în PostgreSQL PoetryHub (`WriteLexiconWord`, `WriteCachedLookup`).
 *
 * Coloanele sunt aceleași; modelele diferă doar prin nume de tabel.
 *
 * Pregătire:
 *   - `npx prisma migrate dev` sau `db push` pe poetryhub (tabelele write trebuie să existe).
 *
 * Rulare (calea la dev.db din repo-ul rhymescheme):
 *   RHYMESCHEME_SQLITE_PATH=/Users/you/Documents/GitHub/rhymescheme/prisma/dev.db npx tsx scripts/import-lexicon-from-sqlite.ts
 *
 * Variabile: `DATABASE_URL` din `.env` (Postgres poetryhub).
 */
import 'dotenv/config'
import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'

const SQLITE_PATH = process.env.RHYMESCHEME_SQLITE_PATH
const BATCH = 500

async function main() {
  if (!SQLITE_PATH) {
    console.error(
      'Setează RHYMESCHEME_SQLITE_PATH către fișierul SQLite rhymescheme (ex. …/rhymescheme/prisma/dev.db).',
    )
    process.exit(1)
  }

  const sqlite = new Database(SQLITE_PATH, { fileMustExist: true, readonly: true })
  const prisma = new PrismaClient()

  try {
    const wordRows = sqlite.prepare(`SELECT * FROM Word`).all() as Record<string, unknown>[]
    console.log(`SQLite Word: ${wordRows.length} rânduri`)

    let insertedWords = 0
    for (let i = 0; i < wordRows.length; i += BATCH) {
      const chunk = wordRows.slice(i, i + BATCH).map((r) => ({
        id: String(r.id),
        word: String(r.word),
        baseForm: String(r.baseForm),
        type: String(r.type),
        syllables: String(r.syllables),
        syllableCount: Number(r.syllableCount),
        endingKey: String(r.endingKey),
        endingLast: String(r.endingLast),
        definition: r.definition == null ? null : String(r.definition),
        synonymsJson: String(r.synonymsJson ?? '[]'),
        createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(String(r.createdAt)),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt : new Date(String(r.updatedAt)),
      }))
      const r = await prisma.writeLexiconWord.createMany({ data: chunk, skipDuplicates: true })
      insertedWords += r.count
    }
    console.log(`WriteLexiconWord: inserate (noi, duplicate ignorate): ${insertedWords}`)

    const cacheRows = sqlite.prepare(`SELECT * FROM CachedLookup`).all() as Record<string, unknown>[]
    console.log(`SQLite CachedLookup: ${cacheRows.length} rânduri`)

    let insertedCache = 0
    for (let i = 0; i < cacheRows.length; i += BATCH) {
      const chunk = cacheRows.slice(i, i + BATCH).map((r) => ({
        id: String(r.id),
        cacheKey: String(r.cacheKey),
        source: String(r.source),
        payload: String(r.payload),
        createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(String(r.createdAt)),
      }))
      const r = await prisma.writeCachedLookup.createMany({ data: chunk, skipDuplicates: true })
      insertedCache += r.count
    }
    console.log(`WriteCachedLookup: inserate (noi): ${insertedCache}`)
  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
