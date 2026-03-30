#!/usr/bin/env tsx
/**
 * Deletes every poem whose language is not Romanian (`ro`).
 * PoemTag and Favorite rows for those poems are removed via cascade.
 *
 * Run: npm run db:prune-non-ro
 * Requires DATABASE_URL (or a .env file in the project root).
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

loadEnvFromDotenv()

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env or the environment.')
    process.exit(1)
  }

  const count = await prisma.poem.count({ where: { language: { not: 'ro' } } })
  console.log(`Deleting ${count} non-Romanian poem(s) (language !== "ro")…`)

  const result = await prisma.poem.deleteMany({
    where: { language: { not: 'ro' } },
  })

  console.log(`Done. Removed ${result.count} poem(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
