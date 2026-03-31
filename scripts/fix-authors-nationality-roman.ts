#!/usr/bin/env tsx
/**
 * Updates Author.nationality from "Română" (any casing, surrounding spaces) to "Român".
 *
 * Usage:
 *   npm run db:fix-nationality-roman
 *   npm run db:fix-nationality-roman -- --dry-run   # list matches only, no UPDATE
 *
 * Requires DATABASE_URL (or `.env` in project root).
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'

function loadEnvFromDotenv() {
  if (process.env.DATABASE_URL) return
  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1)
    if (process.env[k] === undefined) process.env[k] = v
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadEnvFromDotenv()
  const prisma = new PrismaClient()
  try {
    const matches = await prisma.$queryRaw<Array<{ id: string; nationality: string | null }>>`
      SELECT id, nationality
      FROM "Author"
      WHERE nationality IS NOT NULL
        AND LOWER(TRIM(BOTH FROM nationality)) = 'română'
    `
    const distinct = [...new Set(matches.map((m) => m.nationality).filter(Boolean))]
    if (distinct.length) {
      console.log('Values that will become "Român":', distinct.join(', '))
    } else {
      console.log(
        'No authors with nationality matching "Română" (case/trim-insensitive). Already "Român" or different spelling.',
      )
    }

    if (dryRun) {
      console.log(`Dry run: would update ${matches.length} row(s).`)
      return
    }

    const n = await prisma.$executeRaw`
      UPDATE "Author"
      SET nationality = 'Român'
      WHERE nationality IS NOT NULL
        AND LOWER(TRIM(BOTH FROM nationality)) = 'română'
    `
    const updated = typeof n === 'bigint' ? Number(n) : n
    console.log(`Updated ${updated} author(s): nationality "Română" (any case/trim) → "Român".`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
