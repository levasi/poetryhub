#!/usr/bin/env tsx
/**
 * Bulk-import poems from https://www.romanianvoice.com/poezii/ (Romanian Voice poetry archive).
 *
 * Crawls poet index pages, translation indexes, balade, and creștine sections, then fetches each poem HTML.
 * This is the practical way to load a large catalog of Romanian (and some translated) classic poetry;
 * it is not literally “every poet who ever lived” — that would need additional licensed corpora.
 *
 * Usage:
 *   npm run poems:import-ro -- --dry-run                 # counts only
 *   npm run poems:import-ro -- --romanian-only --dry-run # count Romanian (`ro`) only
 *   npm run poems:import-ro -- --limit=20                # smoke test
 *   npm run poems:import-ro -- --romanian-only           # full DB import, Romanian text only
 *
 * Options:
 *   --dry-run        No database writes
 *   --romanian-only  Skip non-Romanian poem pages (foreign translations on poet pages)
 *   --limit=N        Max poems to import after discovery
 *   --max-poets=N    Only crawl the first N poet index pages (faster tests)
 *   --delay=Ms       Pause between HTTP requests (default 400)
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

const BASE = 'https://www.romanianvoice.com/poezii'
const INDEX_URL = `${BASE}/index.php`

const FETCH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

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

function langFromPoetPageUrl(poetUrl: string): string {
  const m = poetUrl.match(/poeti_tr\/[a-z0-9]+_([a-z]{3})\.php$/i)
  if (!m) return 'ro'
  const code = m[1].toLowerCase()
  const map: Record<string, string> = {
    eng: 'en',
    fra: 'fr',
    ger: 'de',
    sve: 'sv',
    por: 'pt',
    esp: 'es',
  }
  return map[code] ?? 'ro'
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: FETCH_HEADERS, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = await res.arrayBuffer()
  const ct = res.headers.get('content-type') ?? ''
  const charset = ct.match(/charset=([^;]+)/i)?.[1]?.toLowerCase() ?? ''
  if (charset.includes('8859') || charset.includes('iso-8859')) {
    return Buffer.from(buf).toString('latin1')
  }
  return new TextDecoder('utf-8').decode(buf)
}

function htmlToPoemText(html: string): string {
  let s = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  return s
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim()
}

/** Parsed poem body; strips trailing translator notes in small font when possible */
function trimTranslatorNote(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (const line of lines) {
    if (/^\(\d{4}/.test(line.trim()) && line.includes('Translated')) break
    out.push(line)
  }
  return out.join('\n').trim()
}

interface ParsedPoem {
  title: string
  author: string
  content: string
}

function parsePoemHtml(html: string): ParsedPoem | null {
  // English / other translations: +2 author, then +1 title (poezii_tr)
  const tr = html.match(
    /<font size="\+2">([^<]*)<\/font>\s*<hr[^>]*>[\s\S]*?<font size="\+1">([^<]*)<\/font>[\s\S]*?<br\s*\/?>[\s\S]*?<br\s*\/?>\s*([\s\S]*?)<hr color="#C0C596"/i,
  )
  if (tr) {
    const author = tr[1].trim()
    const title = tr[2].trim()
    let content = htmlToPoemText(tr[3])
    content = trimTranslatorNote(content)
    if (author && title && content.length > 8) return { title, author, content }
  }

  // Standard Romanian: middletoplink author + +1 title
  const mid = html.match(/class="middletoplink"[^>]*>([^<]+)<\/a>/i)
  const t1 = html.match(/<font size="\+1">([^<]*)<\/font>/i)
  if (mid && t1) {
    const author = mid[1].trim()
    const title = t1[1].trim()
    const block = html.match(
      /<font size="\+1">[^<]*<\/font>\s*(?:<br\s*\/?>\s*)+([\s\S]*?)<hr color="#C0C596"/i,
    )
    if (block) {
      const content = htmlToPoemText(block[1])
      if (author && title && content.length > 8) return { title, author, content }
    }
  }

  // Balade / creștine: +2 title, (author) in italic, body after first hr
  const bal = html.match(
    /<font size="\+2">([^<]*)<\/font>\s*<i>\s*\(([^)]+)\)\s*<\/i>\s*<hr[^>]*>[\s\S]*?<br\s*\/?>([\s\S]*?)<hr color="#C0C596"/i,
  )
  if (bal) {
    const title = bal[1].trim()
    const author = bal[2].trim()
    const content = htmlToPoemText(bal[3])
    if (author && title && content.length > 8) return { title, author, content }
  }

  return null
}

function discoverPoetUrls(indexHtml: string): string[] {
  const set = new Set<string>()
  const re = /https?:\/\/www\.romanianvoice\.com\/poezii\/(poeti|poeti_tr)\/[a-z0-9_]+\.php/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(indexHtml)) !== null) set.add(m[0])
  return [...set]
}

function extractPoemLinksFromPoetPage(html: string, pageUrl: string): string[] {
  const set = new Set<string>()
  const re = /href="(\.\.\/)+(poezii|poezii_tr)\/([^"]+\.php)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const rel = m[0].match(/href="([^"]+)"/i)?.[1]
    if (!rel) continue
    try {
      set.add(new URL(rel, pageUrl).href)
    } catch {
      /* skip */
    }
  }
  return [...set]
}

/** Same-directory .php links (balade, creștine index pages) */
function extractSectionPoemUrls(html: string, sectionBaseUrl: string): string[] {
  const set = new Set<string>()
  const re = /href="([a-z0-9_]+\.php)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m[1] === 'index.php') continue
    try {
      set.add(new URL(m[1], sectionBaseUrl).href)
    } catch {
      /* skip */
    }
  }
  return [...set]
}

interface Queued {
  url: string
  lang: string
}

async function collectAllPoemUrls(delay: number, maxPoets: number): Promise<Queued[]> {
  const indexHtml = await fetchHtml(INDEX_URL)
  await sleep(delay)

  const poetUrls = discoverPoetUrls(indexHtml).slice(0, maxPoets)
  const queue: Queued[] = []
  const seen = new Set<string>()

  const push = (url: string, lang: string) => {
    if (seen.has(url)) return
    seen.add(url)
    queue.push({ url, lang })
  }

  for (const u of [`${BASE}/balade/index.php`, `${BASE}/crestine/index.php`]) {
    const html = await fetchHtml(u)
    const base = u.replace(/index\.php$/i, '')
    for (const p of extractSectionPoemUrls(html, base)) push(p, 'ro')
    await sleep(delay)
  }

  for (const poetUrl of poetUrls) {
    const lang = langFromPoetPageUrl(poetUrl)
    let html: string
    try {
      html = await fetchHtml(poetUrl)
    } catch (e) {
      console.error(`  ⚠ Skip poet list (fetch failed): ${poetUrl}`, e)
      await sleep(delay)
      continue
    }
    for (const poemUrl of extractPoemLinksFromPoetPage(html, poetUrl)) push(poemUrl, lang)
    await sleep(delay)
  }

  return queue
}

async function main() {
  const args = parseArgs()
  const dryRun = args['dry-run'] === 'true'
  const romanianOnly = args['romanian-only'] === 'true'
  const limit = args.limit ? parseInt(args.limit, 10) : Infinity
  const delay = args.delay ? parseInt(args.delay, 10) : 400
  const maxPoets = args['max-poets'] ? parseInt(args['max-poets'], 10) : Infinity

  const prisma = new PrismaClient({ log: ['error'] })

  console.log('🔗 Romanian Voice — discovering poem URLs…\n')
  let queue = await collectAllPoemUrls(delay, maxPoets)
  if (romanianOnly) {
    const before = queue.length
    queue = queue.filter((q) => q.lang === 'ro')
    console.log(`   Romanian-only: ${queue.length} URLs (dropped ${before - queue.length} non-ro).\n`)
  } else {
    console.log(`   Found ${queue.length} unique poem URLs.\n`)
  }

  const toImport = Number.isFinite(limit) ? queue.slice(0, limit) : queue
  if (dryRun) {
    console.log(
      `   Dry run: would import ${toImport.length} poems (limit=${limit === Infinity ? 'none' : limit}${romanianOnly ? ', romanian-only' : ''}).`,
    )
    await prisma.$disconnect()
    return
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env or the environment.')
    await prisma.$disconnect()
    process.exit(1)
  }

  console.log('🔗 Connecting to database…')
  await prisma.$connect()

  let imported = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < toImport.length; i++) {
    const { url, lang } = toImport[i]
    try {
      const html = await fetchHtml(url)
      const parsed = parsePoemHtml(html)
      if (!parsed) {
        errors++
        console.error(`  ✗ Parse failed: ${url}`)
        await sleep(delay)
        continue
      }

      const { title, author, content } = parsed
      const authorSlug = slugify(author) || 'unknown'
      let dbAuthor = await prisma.author.findUnique({ where: { slug: authorSlug } })
      if (!dbAuthor) {
        dbAuthor = await prisma.author.create({
          data: {
            name: author,
            slug: authorSlug,
            nationality: lang === 'ro' ? 'Română' : undefined,
          },
        })
      }

      const dup = await prisma.poem.findFirst({
        where: { title, authorId: dbAuthor.id },
      })
      if (dup) {
        skipped++
        await sleep(delay)
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
          authorId: dbAuthor.id,
          language: lang,
          source: 'imported',
          sourceUrl: url,
        },
      })
      imported++
      if (imported % 25 === 0) console.log(`   … ${imported} imported`)
    } catch (e) {
      errors++
      console.error(`  ✗ ${url}`, e)
    }
    await sleep(delay)
  }

  await prisma.importLog.create({
    data: {
      source: 'romanianvoice-cli',
      status: errors === 0 ? 'success' : 'partial',
      imported,
      skipped,
      errors,
      details: `Poems from ${INDEX_URL} (Romanian Voice).`,
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
