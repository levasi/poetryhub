#!/usr/bin/env tsx
/**
 * CLI script: import poems from PoetryDB into the database.
 * Run with: npm run poems:import [-- --count=50 --author="Edgar Allan Poe"]
 *
 * Usage examples:
 *   npm run poems:import                     # import 30 random short poems
 *   npm run poems:import -- --count=100      # import 100 poems
 *   npm run poems:import -- --author="Keats" # all poems by Keats
 */

import { PrismaClient } from '@prisma/client'

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueSlug(text: string): string {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 7)}`
}

function estimateReadingTime(content: string): number {
  return Math.ceil((content.trim().split(/\s+/).length / 200) * 60)
}

function extractExcerpt(content: string, lines = 2): string {
  return content.split('\n').map(l => l.trim()).filter(Boolean).slice(0, lines).join('\n')
}

// ── CLI argument parsing ──────────────────────────────────────────────────────

function parseArgs() {
  const args: Record<string, string> = {}
  process.argv.slice(2).forEach(arg => {
    const [key, val] = arg.replace(/^--/, '').split('=')
    if (key) args[key] = val ?? 'true'
  })
  return args
}

// ── PoetryDB types ────────────────────────────────────────────────────────────

interface PoetryDBPoem {
  title:     string
  author:    string
  lines:     string[]
  linecount: string
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient({
    log: ['error'],
  })

  const args   = parseArgs()
  const count  = parseInt(args.count ?? '30')
  const author = args.author

  console.log('🔗 Connecting to database…')
  await prisma.$connect()

  // Build PoetryDB URL
  const BASE = process.env.POETRY_DB_URL ?? 'https://poetrydb.org'
  let url: string

  if (author) {
    url = `${BASE}/author/${encodeURIComponent(author)}`
    console.log(`📖 Fetching poems by "${author}"…`)
  } else {
    // Fetch poems with 4–20 lines (compact poems suitable for reading)
    url = `${BASE}/linecount/4,20/${count}`
    console.log(`📖 Fetching ${count} short poems from PoetryDB…`)
  }

  let poems: PoetryDBPoem[]
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) {
      console.error('❌ PoetryDB returned unexpected response:', data)
      process.exit(1)
    }
    poems = data
  } catch (err) {
    console.error('❌ Failed to fetch from PoetryDB:', err)
    process.exit(1)
  }

  console.log(`\n✅ Fetched ${poems.length} poems. Importing…\n`)

  let imported = 0
  let skipped  = 0
  let errors   = 0

  for (const raw of poems.slice(0, count)) {
    try {
      const content = raw.lines.join('\n').trim()
      if (!content) { skipped++; continue }

      // Upsert author
      const authorSlug = slugify(raw.author)
      let dbAuthor = await prisma.author.findUnique({ where: { slug: authorSlug } })
      if (!dbAuthor) {
        dbAuthor = await prisma.author.create({
          data: { name: raw.author, slug: authorSlug },
        })
        process.stdout.write(`  + Author: ${raw.author}\n`)
      }

      // Skip duplicate
      const dup = await prisma.poem.findFirst({ where: { title: raw.title, authorId: dbAuthor.id } })
      if (dup) { skipped++; continue }

      // Unique slug
      let poemSlug = slugify(raw.title)
      const slugExists = await prisma.poem.findUnique({ where: { slug: poemSlug } })
      if (slugExists) poemSlug = uniqueSlug(raw.title)

      await prisma.poem.create({
        data: {
          title:       raw.title,
          slug:        poemSlug,
          content,
          excerpt:     extractExcerpt(content),
          readingTime: estimateReadingTime(content),
          authorId:    dbAuthor.id,
          language:    'en',
          source:      'imported',
          sourceUrl:   `https://poetrydb.org/title/${encodeURIComponent(raw.title)}`,
        },
      })

      imported++
      process.stdout.write(`  ✓ "${raw.title}" by ${raw.author}\n`)
    } catch (err) {
      errors++
      console.error(`  ✗ "${raw.title}": ${err}`)
    }
  }

  // Log run
  await prisma.importLog.create({
    data: {
      source:   'poetrydb-cli',
      status:   errors === 0 ? 'success' : 'partial',
      imported,
      skipped,
      errors,
    },
  })

  await prisma.$disconnect()

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`  Imported : ${imported}`)
  console.log(`  Skipped  : ${skipped} (duplicates)`)
  console.log(`  Errors   : ${errors}`)
  console.log(`${'─'.repeat(40)}\n`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
