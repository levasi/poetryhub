#!/usr/bin/env tsx
/**
 * Normalizes Romanian diacritics on poem fields using official Unicode forms.
 *
 * Uses `js-romanian-diacritics` `standard()`:
 *   Ş/ş → Ș/ș, Ţ/ţ → Ț/ț, Ã/ã → Ă/ă (legacy Windows / cedilla → correct comma-below & breve).
 *
 * This does **not** guess diacritics on plain ASCII (e.g. "in" → "în"); that needs
 * re-import from a correct source or a dedicated ML tool.
 *
 * Usage:
 *   npm run db:ro-diacritics -- --dry-run          # report only
 *   npm run db:ro-diacritics                       # update Romanian (`ro`) poems
 *   npm run db:ro-diacritics -- --all-languages    # run on every poem (use if mixed text)
 *
 * Requires DATABASE_URL (or `.env` in project root).
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { officialRomanianDiacritics } from '../server/utils/romanianDiacritics'

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

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    allLanguages: args.includes('--all-languages'),
  }
}

function normalizeFields(title: string, content: string, excerpt: string | null) {
  const t = officialRomanianDiacritics(title)
  const c = officialRomanianDiacritics(content)
  const e = excerpt == null ? null : officialRomanianDiacritics(excerpt)
  return { title: t, content: c, excerpt: e }
}

async function main() {
  const { dryRun, allLanguages } = parseArgs()

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env or the environment.')
    process.exit(1)
  }

  const where = allLanguages ? {} : { language: 'ro' as const }

  const poems = await prisma.poem.findMany({
    where,
    select: { id: true, title: true, content: true, excerpt: true, language: true },
  })

  let changed = 0
  for (const p of poems) {
    const { title, content, excerpt } = normalizeFields(p.title, p.content, p.excerpt)
    if (title === p.title && content === p.content && excerpt === p.excerpt) continue

    changed++
    if (dryRun) {
      console.log(`[dry-run] would update ${p.id} (${p.language}) — ${p.title.slice(0, 48)}…`)
      continue
    }

    await prisma.poem.update({
      where: { id: p.id },
      data: { title, content, excerpt },
    })
  }

  const scope = allLanguages ? 'all languages' : 'language = ro'
  console.log(
    dryRun
      ? `Dry run: ${changed} poem(s) would be updated (${scope}).`
      : `Updated ${changed} poem(s) (${scope}).`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
