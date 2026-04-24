/**
 * Import DEX (PDF) definitions into `WriteLexiconWord.definition`.
 *
 * - Adds missing lemmas if `wordToLexiconFields` can parse them.
 * - For duplicates, overwrites the DB definition with the PDF definition (requested).
 *
 * Run:
 *   npx tsx scripts/import-dex-definitions.ts
 *   # or: npm run write:dex
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Prisma, PrismaClient } from '@prisma/client'
import { PDFParse } from 'pdf-parse'
import { wordToLexiconFields } from '../lib/rhyme/lexiconRow'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')
const ROOT = join(__dirname, '..')
const PDF_PATH = join(ROOT, 'Dictionar-Explicativ-Al-Limbii-Romane-pdf.pdf')

const UPDATE_BATCH = 250
const CREATE_BATCH = 800

function isAllCapsToken(tok: string): boolean {
  if (!tok) return false
  // Romanian uppercase letters + a few punctuation marks appear in the source.
  return /^[A-ZĂÂÎȘȚ]+$/.test(tok)
}

function looksLikeEntryStart(line: string): boolean {
  const s = line.trim()
  if (!s) return false
  if (s.startsWith('-- ') && s.includes(' of ')) return false
  if (s.startsWith('Dicţionar explicativ')) return false
  if (s.startsWith('Dicționar explicativ')) return false
  if (s.startsWith('/<') || s.startsWith('/v.') || s.startsWith('/Onomat')) return false

  const toks = s.split(/\s+/)
  if (!toks.length) return false

  // Typical: "ABACĂ ..." or "A ABANDONA ..."
  if (isAllCapsToken(toks[0]!) && toks[0]!.length >= 2) return true
  if (toks[0] === 'A' && toks[1] && isAllCapsToken(toks[1])) return true
  if (toks[0] === 'A' && toks[1] && toks[1]!.length === 1) return true // A I A I prep.
  return false
}

function extractLemma(line: string): string | null {
  const s = line.trim()
  const toks = s.split(/\s+/)
  if (!toks.length) return null

  if (toks[0] === 'A') {
    // "A ABANDONA ..." or "A SE ABATE ..."
    if (toks[1] === 'SE' && toks[2] && isAllCapsToken(toks[2])) return toks[2].toLowerCase()
    if (toks[1] && isAllCapsToken(toks[1])) {
      if (toks[1].length === 1) return 'a'
      return toks[1].toLowerCase()
    }
    return 'a'
  }

  if (isAllCapsToken(toks[0]!) && toks[0]!.length >= 2) return toks[0]!.toLowerCase()
  return null
}

function normalizeDefBlock(lines: string[], lemma: string): string | null {
  const cleaned = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith('/<') && !l.startsWith('/v.') && !l.startsWith('/Onomat'))
    .filter((l) => !(l.startsWith('-- ') && l.includes(' of ')))
    .filter((l) => !l.startsWith('Dicţionar explicativ') && !l.startsWith('Dicționar explicativ'))

  if (!cleaned.length) return null

  const joined = cleaned.join(' ').replace(/\s+/g, ' ').trim()
  if (!joined) return null

  // Heuristic: drop the lemma prefix and morphology chunk when present.
  // Example: "ABAJUR ... n. Dispozitiv ..." => keep from first POS marker onwards.
  const pos = joined.match(/\b(?:adj|adv|interj|prep|pron|tranz|intranz|m|f|n)\./)
  let out = joined
  if (pos && pos.index != null) {
    const after = joined.slice(pos.index + pos[0].length).trim()
    out = after || joined
  } else {
    // fallback: remove leading lemma token
    const re = new RegExp(`^${lemma.toUpperCase()}\\b\\s*`, 'u')
    out = joined.replace(re, '').trim()
  }

  // Defensive: prevent empty / too-short definitions.
  if (out.length < 8) return null
  return out
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  console.log(`[dex] reading PDF: ${PDF_PATH}`)
  const buf = await readFile(PDF_PATH)
  const parser = new PDFParse({ verbosityLevel: 0, data: buf })
  await parser.load()
  const res = await parser.getText()
  const text = (res && typeof res === 'object' && 'text' in res ? String((res as { text?: unknown }).text ?? '') : String(res ?? '')).trim()
  if (!text) throw new Error('Empty PDF text')

  const lines = text.split(/\r?\n/)
  const byLemma = new Map<string, string>()

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (!looksLikeEntryStart(line)) {
      i++
      continue
    }
    const lemma = extractLemma(line)
    if (!lemma) {
      i++
      continue
    }

    const block: string[] = [line]
    i++
    while (i < lines.length && !looksLikeEntryStart(lines[i] ?? '')) {
      block.push(lines[i] ?? '')
      i++
    }

    const def = normalizeDefBlock(block, lemma)
    if (!def) continue

    const prev = byLemma.get(lemma)
    // If multiple blocks map to same lemma (homonyms), keep the longer one.
    if (!prev || def.length > prev.length) byLemma.set(lemma, def)
  }

  console.log(`[dex] parsed lemmas with defs: ${byLemma.size}`)

  const entries = [...byLemma.entries()].map(([w, d]) => ({
    word: w,
    definition: d,
  }))

  console.log('[dex] loading existing lexicon words…')
  const existingWords = new Set(
    (await prisma.writeLexiconWord.findMany({ select: { word: true } })).map((r) => r.word),
  )

  const toUpdate: Array<{ word: string; definition: string }> = []
  const toCreate: Array<ReturnType<typeof wordToLexiconFields> & { definition: string; synonymsJson: string }> = []

  let skippedInvalid = 0
  for (const e of entries) {
    if (existingWords.has(e.word)) {
      toUpdate.push(e)
      continue
    }
    const fields = wordToLexiconFields(e.word)
    if (!fields) {
      skippedInvalid++
      continue
    }
    toCreate.push({ ...fields, definition: e.definition, synonymsJson: '[]' })
  }

  console.log(`[dex] plan: update=${toUpdate.length}, create=${toCreate.length}, skipped_invalid=${skippedInvalid}`)

  // Bulk UPDATE via VALUES join (fast; overwrites duplicates from PDF)
  for (const group of chunk(toUpdate, UPDATE_BATCH)) {
    const values = group.map((r) => Prisma.sql`(${r.word}, ${r.definition})`)
    await prisma.$executeRaw(Prisma.sql`
      UPDATE "WriteLexiconWord" AS w
      SET "definition" = v."definition"
      FROM (VALUES ${Prisma.join(values)}) AS v("word", "definition")
      WHERE w."word" = v."word"
    `)
  }

  // Bulk CREATE missing lemmas
  for (const group of chunk(toCreate, CREATE_BATCH)) {
    await prisma.writeLexiconWord.createMany({ data: group, skipDuplicates: true })
  }

  console.log(
    `[dex] done. parsed=${entries.length}, updated=${toUpdate.length}, created=${toCreate.length}, skipped_invalid=${skippedInvalid}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

