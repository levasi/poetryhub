#!/usr/bin/env tsx
/**
 * Sets a portrait for every author missing `imageUrl`:
 * 1) Wikipedia / Wikimedia thumbnail (name, then slug-based search)
 * 2) Same DiceBear URL as the app UI fallback
 *
 * Run: npm run authors:portraits
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { fetchWikipediaPortraitUrlForAuthor } from '../server/utils/wikipediaPortrait'
import { dicebearAuthorUrl } from '../utils/authorAvatar'

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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env or the environment.')
    process.exit(1)
  }

  const authors = await prisma.author.findMany({
    where: { OR: [{ imageUrl: null }, { imageUrl: '' }] },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })

  console.log(`Found ${authors.length} author(s) without a stored photo.`)

  let wiki = 0
  let fallback = 0

  for (const a of authors) {
    const remote = await fetchWikipediaPortraitUrlForAuthor(a.name, a.slug)
    await delay(200)

    const url = remote ?? dicebearAuthorUrl(a.slug, a.name)
    if (remote) wiki++
    else fallback++

    await prisma.author.update({ where: { id: a.id }, data: { imageUrl: url } })
    console.log(remote ? `  ✓ ${a.name} (Wikipedia)` : `  ◆ ${a.name} (generated avatar)`)
  }

  console.log(`Done. Wikipedia: ${wiki}, DiceBear fallback: ${fallback}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
