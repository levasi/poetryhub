/**
 * Bulk-import Romanian lemmas for `/write` search (same sources as rhymescheme).
 * Run: `npx tsx scripts/import-write-lexicon.ts` after `npx prisma migrate dev` / `db push`.
 */
import 'dotenv/config'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'node:url'
import { wordToLexiconFields } from '../lib/rhyme/lexiconRow'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const IPA_URL = 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/ro.txt'
const IPA_FILE = join(ROOT, 'data/lexicon/ro-ipa.txt')
const HUNSPELL_URL =
  'https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/ro/index.dic'
const HUNSPELL_FILE = join(ROOT, 'data/lexicon/ro-hunspell.dic')
const BATCH = 800

async function ensureDownload(url: string, dest: string, minBytes: number): Promise<void> {
  try {
    const s = await stat(dest)
    if (s.size >= minBytes) {
      console.log(`Cache OK: ${dest} (${(s.size / 1024).toFixed(0)} KB)`)
      return
    }
  } catch {
    /* fetch */
  }
  console.log(`Downloading …\n  ${url}`)
  await mkdir(dirname(dest), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const body = res.body
  if (!body) throw new Error('Empty body')
  await pipeline(body, createWriteStream(dest))
  const st = await stat(dest)
  console.log(`  → ${dest} (${(st.size / 1024).toFixed(0)} KB)\n`)
}

async function main() {
  await ensureDownload(IPA_URL, IPA_FILE, 10_000)
  await ensureDownload(HUNSPELL_URL, HUNSPELL_FILE, 500_000)

  const prisma = new PrismaClient()
  const seen = new Set<string>()
  let totalInserted = 0

  const batch: Prisma.WriteLexiconWordCreateManyInput[] = []

  async function flush() {
    if (!batch.length) return
    const words = batch.map((b) => b.word)
    const existing = await prisma.writeLexiconWord.findMany({
      where: { word: { in: words } },
      select: { word: true },
    })
    const have = new Set(existing.map((e) => e.word))
    const fresh = batch.filter((b) => !have.has(b.word))
    batch.length = 0
    if (!fresh.length) return
    const r = await prisma.writeLexiconWord.createMany({ data: fresh })
    totalInserted += r.count
  }

  function pushRow(raw: string) {
    const fields = wordToLexiconFields(raw)
    if (!fields) return false
    if (seen.has(fields.word)) return false
    seen.add(fields.word)
    batch.push({
      ...fields,
      definition: null,
      synonymsJson: '[]',
    })
    return true
  }

  let ipa = 0
  const ipaLines = (await readFile(IPA_FILE, 'utf8')).split(/\r?\n/)
  for (const line of ipaLines) {
    const tab = line.indexOf('\t')
    const raw = tab === -1 ? line.trim() : line.slice(0, tab).trim()
    if (!raw) continue
    if (pushRow(raw)) {
      ipa++
      if (ipa % 10_000 === 0) console.log(`IPA … ${ipa}`)
    }
    if (batch.length >= BATCH) await flush()
  }
  await flush()
  console.log(`IPA-dict: ${ipa} lemmas processed (unique).\n`)

  let hun = 0
  let first = true
  const hunLines = (await readFile(HUNSPELL_FILE, 'utf8')).split(/\r?\n/)
  for (const line of hunLines) {
    if (first) {
      first = false
      if (/^\d+$/.test(line.trim())) continue
    }
    const raw = line.split('/')[0]!.trim()
    if (!raw) continue
    if (pushRow(raw)) {
      hun++
      if (hun % 25_000 === 0) console.log(`Hunspell … ${hun}`)
    }
    if (batch.length >= BATCH) await flush()
  }
  await flush()
  console.log(`Hunspell: ${hun} new unique lemmas processed.\n`)

  console.log(
    `Finished. Inserted ${totalInserted} new rows. Unique lemmas in index: ${seen.size}.`,
  )
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
