#!/usr/bin/env tsx
/**
 * Fetches birth/death years from Wikidata (public API) for each Author and updates the DB.
 *
 * Usage:
 *   npx tsx scripts/fetch-author-life-years-wikidata.ts --dry-run    # preview only
 *   npx tsx scripts/fetch-author-life-years-wikidata.ts --apply      # write to DB
 *   npx tsx scripts/fetch-author-life-years-wikidata.ts --apply --slug=mihai-eminescu
 *
 * Requires DATABASE_URL or `.env` in project root.
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

const UA = 'PoetryHub/1.0 (author life-years import; https://github.com/)'

function yearFromWikidataTime(timeStr: string | undefined): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null
  const m = timeStr.match(/^\+(\d{1,4})-/)
  if (m) return parseInt(m[1]!, 10)
  const m2 = timeStr.match(/^-(\d{1,4})-/)
  if (m2) return -parseInt(m2[1]!, 10)
  return null
}

function extractYearFromClaim(claims: Record<string, unknown> | undefined, pid: string): number | null {
  if (!claims || !claims[pid]) return null
  const arr = claims[pid] as Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>
  if (!Array.isArray(arr) || !arr.length) return null
  const v = arr[0]?.mainsnak?.datavalue?.value
  if (v && typeof v === 'object' && v !== null && 'time' in v) {
    return yearFromWikidataTime((v as { time: string }).time)
  }
  return null
}

interface SearchHit {
  id: string
  label: string
  description?: string
}

async function wikidataSearch(name: string): Promise<SearchHit[]> {
  const url = new URL('https://www.wikidata.org/w/api.php')
  url.searchParams.set('action', 'wbsearchentities')
  url.searchParams.set('search', name)
  url.searchParams.set('language', 'ro')
  url.searchParams.set('uselang', 'ro')
  url.searchParams.set('type', 'item')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '8')
  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Wikidata search HTTP ${res.status}`)
  const data = (await res.json()) as { search?: SearchHit[] }
  return data.search ?? []
}

async function wikidataClaimsForId(qid: string): Promise<Record<string, unknown> | null> {
  const url = new URL('https://www.wikidata.org/w/api.php')
  url.searchParams.set('action', 'wbgetentities')
  url.searchParams.set('ids', qid)
  url.searchParams.set('format', 'json')
  url.searchParams.set('props', 'claims')
  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Wikidata wbgetentities HTTP ${res.status}`)
  const data = (await res.json()) as {
    entities?: Record<string, { claims?: Record<string, unknown> }>
  }
  const ent = data.entities?.[qid]
  return ent?.claims ?? null
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const apply = process.argv.includes('--apply')
  const slugArg = process.argv.find((a) => a.startsWith('--slug='))
  const onlySlug = slugArg ? slugArg.slice('--slug='.length) : null

  if (dryRun && apply) {
    console.error('Use only one of --dry-run or --apply.')
    process.exit(1)
  }
  if (!dryRun && !apply) {
    console.error('Pass --dry-run (preview) or --apply (write to database).')
    process.exit(1)
  }

  loadEnvFromDotenv()
  const prisma = new PrismaClient()

  try {
    const authors = await prisma.author.findMany({
      where: onlySlug ? { slug: onlySlug } : undefined,
      select: { id: true, name: true, slug: true, birthYear: true, deathYear: true },
      orderBy: { name: 'asc' },
    })

    if (!authors.length) {
      console.log(onlySlug ? `No author with slug "${onlySlug}".` : 'No authors found.')
      return
    }

    const results: Array<{
      slug: string
      name: string
      qid: string | null
      label: string | null
      birth: number | null
      death: number | null
      note?: string
    }> = []

    for (const a of authors) {
      await sleep(200)

      let hits: SearchHit[] = []
      try {
        hits = await wikidataSearch(a.name)
      } catch (e) {
        results.push({
          slug: a.slug,
          name: a.name,
          qid: null,
          label: null,
          birth: null,
          death: null,
          note: `search error: ${e instanceof Error ? e.message : String(e)}`,
        })
        continue
      }

      if (!hits.length) {
        results.push({
          slug: a.slug,
          name: a.name,
          qid: null,
          label: null,
          birth: null,
          death: null,
          note: 'no Wikidata search results',
        })
        continue
      }

      let chosen: { qid: string; label: string; birth: number | null; death: number | null } | null =
        null

      for (const h of hits.slice(0, 5)) {
        await sleep(150)
        let claims: Record<string, unknown> | null = null
        try {
          claims = await wikidataClaimsForId(h.id)
        } catch {
          continue
        }
        const birth = extractYearFromClaim(claims, 'P569')
        const death = extractYearFromClaim(claims, 'P570')
        if (birth != null || death != null) {
          chosen = { qid: h.id, label: h.label, birth, death }
          break
        }
      }

      if (!chosen) {
        const h0 = hits[0]!
        await sleep(150)
        const claims = await wikidataClaimsForId(h0.id).catch(() => null)
        const birth = claims ? extractYearFromClaim(claims, 'P569') : null
        const death = claims ? extractYearFromClaim(claims, 'P570') : null
        chosen = { qid: h0.id, label: h0.label, birth, death }
      }

      results.push({
        slug: a.slug,
        name: a.name,
        qid: chosen.qid,
        label: chosen.label,
        birth: chosen.birth,
        death: chosen.death,
        note:
          chosen.birth == null && chosen.death == null
            ? 'Wikidata item has no P569/P570'
            : undefined,
      })
    }

    console.log('\n--- Preview (Wikidata) ---\n')
    for (const r of results) {
      const life =
        r.birth != null || r.death != null
          ? `${r.birth ?? '?'}–${r.death ?? '?'}`
          : '(no years)'
      console.log(
        `${r.name}  [${r.slug}]\n  Q: ${r.qid ?? '-'}  ${r.label ? `“${r.label}”` : ''}  →  ${life}${r.note ? `  (${r.note})` : ''}\n`,
      )
    }

    const toUpdate = results.filter(
      (r) => (r.birth != null || r.death != null) && !r.note?.includes('search error'),
    )

    if (dryRun) {
      console.log(`\nDry run: would update ${toUpdate.length} author(s) with at least one year.`)
      return
    }

    let n = 0
    for (const r of toUpdate) {
      const author = authors.find((x) => x.slug === r.slug)
      if (!author) continue
      await prisma.author.update({
        where: { id: author.id },
        data: {
          birthYear: r.birth,
          deathYear: r.death,
        },
      })
      n++
    }
    console.log(`\nUpdated ${n} author(s).`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
