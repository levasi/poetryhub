#!/usr/bin/env tsx
/**
 * Import selected Vasile Alecsandri poems from Romanian Wikisource (ro.wikisource.org).
 * Fetches wikitext via the MediaWiki API, extracts <poem> bodies, strips refs/templates noise.
 *
 * Skipped by design (no single matching poem page on Wikisource):
 *   - Suvenire — only longer prose pieces like "Suvenire din viața mea"
 *   - Ostașii noștri — volume title; poems appear as subpages, not one page with this title
 *
 * Usage:
 *   npm run poems:import-alecsandri-ws -- --dry-run
 *   npm run poems:import-alecsandri-ws
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

const WIKI_API = 'https://ro.wikisource.org/w/api.php'
const AUTHOR_SLUG = 'vasile-alecsandri'

const FETCH_HEADERS: Record<string, string> = {
  'User-Agent': 'PoetryHub/1.0 (https://github.com; import script)',
  Accept: 'application/json',
}

/** Wikisource page title → display title in the app */
const PAGES: { wikiTitle: string; displayTitle: string }[] = [
  { wikiTitle: 'Doina (variantă Alecsandri)', displayTitle: 'Doina' },
  { wikiTitle: 'Strunga', displayTitle: 'Strunga' },
  { wikiTitle: 'Andrii-Popa', displayTitle: 'Andrii-Popa' },
  { wikiTitle: 'Cinel-cinel', displayTitle: 'Cinel-cinel' },
  { wikiTitle: 'Deșteptarea României', displayTitle: 'Deșteptarea României' },
  { wikiTitle: 'Muntele de foc', displayTitle: 'Muntele de foc' },
]

function parseArgs() {
  const args: Record<string, string> = {}
  for (const arg of process.argv.slice(2)) {
    const [key, val] = arg.replace(/^--/, '').split('=')
    if (key) args[key] = val ?? 'true'
  }
  return args
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueSlug(text: string): string {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 7)}`
}

function estimateReadingTime(content: string): number {
  return Math.ceil((content.trim().split(/\s+/).filter(Boolean).length / 200) * 60)
}

function extractExcerpt(content: string, lines = 2): string {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join('\n')
}

function wikiSourceUrl(wikiTitle: string): string {
  const path = encodeURIComponent(wikiTitle.replace(/ /g, '_'))
  return `https://ro.wikisource.org/wiki/${path}`
}

/** Extract main poem text from Wikitext; prefers <poem>...</poem> */
function wikitextToPoemPlain(wikitext: string): string {
  const poemMatch = wikitext.match(/<poem[^>]*>([\s\S]*?)<\/poem>/i)
  let raw = poemMatch ? poemMatch[1] : wikitext

  raw = raw.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
  raw = raw.replace(/\{\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\}/g, '')
  raw = raw.replace(/'''''([^']*)'''''/g, '$1')
  raw = raw.replace(/'''([^']*)'''/g, '$1')
  raw = raw.replace(/''([^']*)''/g, '$1')
  raw = raw.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
  raw = raw.replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => inner.replace(/^.+?:/, ''))
  raw = raw.replace(/\[\d+\]/g, '')
  raw = raw.replace(/&nbsp;/g, ' ')
  raw = raw.replace(/&ndash;/g, '–')
  raw = raw.replace(/&mdash;/g, '—')
  raw = raw.replace(/&amp;/g, '&')
  raw = raw.replace(/&lt;/g, '<')
  raw = raw.replace(/&gt;/g, '>')

  const lines = raw
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim()

  return lines
}

async function fetchWikitext(pageTitle: string): Promise<string> {
  const url = new URL(WIKI_API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('titles', pageTitle)
  url.searchParams.set('prop', 'revisions')
  url.searchParams.set('rvprop', 'content')
  url.searchParams.set('rvslots', 'main')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')

  const res = await fetch(url.toString(), { headers: FETCH_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const data = (await res.json()) as {
    query?: { pages?: Array<{ missing?: boolean; revisions?: Array<{ slots?: { main?: { content?: string } } }> }> }
  }
  const page = data.query?.pages?.[0]
  if (!page || page.missing) throw new Error(`Missing page: ${pageTitle}`)
  const wikitext = page.revisions?.[0]?.slots?.main?.content
  if (!wikitext) throw new Error(`No wikitext for: ${pageTitle}`)
  return wikitext
}

async function main() {
  const args = parseArgs()
  const dryRun = args['dry-run'] === 'true'
  const prisma = new PrismaClient({ log: ['error'] })

  console.log('📚 Wikisource — Vasile Alecsandri (ro.wikisource.org)\n')
  console.log(
    '  Skip: Suvenire (no standalone poem page), Ostașii noștri (volume, not one poem).\n',
  )

  if (!dryRun && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env or the environment.')
    await prisma.$disconnect()
    process.exit(1)
  }

  let author = await prisma.author.findUnique({ where: { slug: AUTHOR_SLUG } })
  if (!author) {
    author = await prisma.author.create({
      data: {
        name: 'Vasile Alecsandri',
        slug: AUTHOR_SLUG,
        nationality: 'Român',
      },
    })
    console.log(`  ✓ Created author: ${author.name}\n`)
  }

  if (dryRun) {
    console.log(`   Dry run: would import ${PAGES.length} poems for ${author.name}.\n`)
    for (const { wikiTitle, displayTitle } of PAGES) {
      console.log(`   - ${displayTitle} ← ${wikiTitle}`)
    }
    await prisma.$disconnect()
    return
  }

  await prisma.$connect()

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const { wikiTitle, displayTitle } of PAGES) {
    const sourceUrl = wikiSourceUrl(wikiTitle)
    try {
      const wikitext = await fetchWikitext(wikiTitle)
      let content = wikitextToPoemPlain(wikitext)
      if (!content || content.length < 20) {
        errors++
        console.error(`  ✗ Too short or empty after parse: ${displayTitle}`)
        continue
      }
      content = officialRomanianDiacritics(content)
      const title = officialRomanianDiacritics(displayTitle)

      const dup = await prisma.poem.findFirst({
        where: { title, authorId: author.id },
      })
      if (dup) {
        skipped++
        console.log(`  ○ Skip duplicate (title): ${title}`)
        continue
      }

      let poemSlug = slugify(title) || 'poezie'
      const slugExists = await prisma.poem.findUnique({ where: { slug: poemSlug } })
      if (slugExists) poemSlug = uniqueSlug(title)

      await prisma.poem.create({
        data: {
          title,
          slug: poemSlug,
          content,
          excerpt: extractExcerpt(content),
          readingTime: estimateReadingTime(content),
          authorId: author.id,
          language: 'ro',
          source: 'imported',
          sourceUrl,
        },
      })
      imported++
      console.log(`  ✓ ${title}`)
    } catch (e) {
      errors++
      console.error(`  ✗ ${displayTitle}`, e)
    }
  }

  await prisma.importLog.create({
    data: {
      source: 'wikisource-alecsandri-cli',
      status: errors === 0 ? 'success' : 'partial',
      imported,
      skipped,
      errors,
      details: `Alecsandri poems from ${WIKI_API} (${PAGES.map((p) => p.wikiTitle).join(', ')}).`,
    },
  })

  await prisma.$disconnect()

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`  Imported : ${imported}`)
  console.log(`  Skipped  : ${skipped} (duplicates)`)
  console.log(`  Errors   : ${errors}`)
  console.log(`${'─'.repeat(40)}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
