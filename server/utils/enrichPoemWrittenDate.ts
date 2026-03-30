/**
 * On poem detail, if written year/period are missing, try Wikipedia (no key) then optional Anthropic.
 * Sets `writtenDateEnrichedAt` after one attempt so we do not call external APIs on every page load.
 */
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const WIKI_UA = 'PoetryHub/1.0 (poetry enrichment; open-source)'

const llmResultSchema = z.object({
  writtenYear: z.number().int().min(500).max(2100).nullable(),
  writtenPeriod: z.string().max(220).nullable(),
})

function wikiHostForLanguage(lang: string): string {
  if (lang === 'ro') return 'ro.wikipedia.org'
  return 'en.wikipedia.org'
}

function extractYears(text: string): number[] {
  const re = /\b(1[0-9]{3}|20[0-3][0-9])\b/g
  const out: number[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const y = Number(m[1])
    if (y >= 1000 && y <= 2035) out.push(y)
  }
  return out
}

function filterYearsByAuthorLife(
  years: number[],
  birthYear: number | null,
  deathYear: number | null,
): number[] {
  if (birthYear == null && deathYear == null) return years
  const lo = birthYear != null ? birthYear - 5 : 1000
  const hi = deathYear != null ? deathYear + 30 : 2035
  const filtered = years.filter((y) => y >= lo && y <= hi)
  return filtered.length ? filtered : years
}

function pickRepresentativeYear(years: number[]): number | null {
  if (!years.length) return null
  const sorted = [...new Set(years)].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

/** Short literary period labels sometimes appearing in Wikipedia leads */
function guessPeriodSnippet(text: string): string | null {
  const t = text.slice(0, 2800)
  const patterns: RegExp[] = [
    /\b(Romantic (?:era|period|movement))\b/i,
    /\b(Victorian (?:era|period|literature))\b/i,
    /\b(Modernist (?:movement|literature|era))\b/i,
    /\b(Georgian (?:era|poetry))\b/i,
    /\b(Harlem Renaissance)\b/i,
    /\b(Beat (?:Generation|poets))\b/i,
    /\b(early (?:20th|21st) century)\b/i,
    /\b(mid(?:dle)?-19th century)\b/i,
  ]
  for (const p of patterns) {
    const m = t.match(p)
    if (m?.[1]) return m[1].replace(/\s+/g, ' ').trim()
  }
  return null
}

async function fetchWikipediaExtract(
  wikiHost: string,
  searchQuery: string,
): Promise<{ extract: string; title: string } | null> {
  const searchParams = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: searchQuery,
    format: 'json',
    srlimit: '4',
  })
  const searchRes = await fetch(`https://${wikiHost}/w/api.php?${searchParams}`, {
    headers: { 'User-Agent': WIKI_UA },
  })
  if (!searchRes.ok) return null
  const sj = await searchRes.json()
  const hits = sj?.query?.search as Array<{ title: string }> | undefined
  if (!hits?.length) return null

  for (const hit of hits) {
    const title = hit.title
    const exParams = new URLSearchParams({
      action: 'query',
      prop: 'extracts',
      explaintext: '1',
      exintro: '1',
      titles: title,
      format: 'json',
      redirects: '1',
    })
    const exRes = await fetch(`https://${wikiHost}/w/api.php?${exParams}`, {
      headers: { 'User-Agent': WIKI_UA },
    })
    if (!exRes.ok) continue
    const ej = await exRes.json()
    const pages = ej?.query?.pages as Record<string, { extract?: string; missing?: boolean }> | undefined
    if (!pages) continue
    const page = Object.values(pages)[0]
    if (page?.missing || !page?.extract?.trim()) continue
    return { extract: page.extract, title }
  }
  return null
}

async function enrichFromWikipedia(
  title: string,
  authorName: string,
  language: string,
  birthYear: number | null,
  deathYear: number | null,
): Promise<{ writtenYear: number | null; writtenPeriod: string | null }> {
  const primaryHost = wikiHostForLanguage(language)
  const queries = [
    `${title} ${authorName}`,
    title,
    `${authorName} ${title}`,
  ]

  for (const q of queries) {
    const got = await fetchWikipediaExtract(primaryHost, q)
    if (!got) continue
    const years = filterYearsByAuthorLife(extractYears(got.extract), birthYear, deathYear)
    const year = pickRepresentativeYear(years)
    const period = year == null ? guessPeriodSnippet(got.extract) : null
    if (year != null || period != null) {
      return { writtenYear: year, writtenPeriod: period }
    }
  }

  if (primaryHost !== 'en.wikipedia.org') {
    for (const q of queries) {
      const got = await fetchWikipediaExtract('en.wikipedia.org', q)
      if (!got) continue
      const years = filterYearsByAuthorLife(extractYears(got.extract), birthYear, deathYear)
      const year = pickRepresentativeYear(years)
      const period = year == null ? guessPeriodSnippet(got.extract) : null
      if (year != null || period != null) {
        return { writtenYear: year, writtenPeriod: period }
      }
    }
  }

  return { writtenYear: null, writtenPeriod: null }
}

function parseLlmJson(text: string): z.infer<typeof llmResultSchema> | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const raw = JSON.parse(text.slice(start, end + 1))
    const parsed = llmResultSchema.safeParse(raw)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

async function enrichFromAnthropic(
  apiKey: string,
  title: string,
  authorName: string,
  language: string,
  wikiHint: string | null,
): Promise<{ writtenYear: number | null; writtenPeriod: string | null }> {
  const client = new Anthropic({ apiKey })
  const context = wikiHint
    ? `Wikipedia excerpt (may be incomplete):\n${wikiHint.slice(0, 2000)}`
    : 'No Wikipedia excerpt was found.'

  const prompt = `You are a careful literary reference assistant.

Poem title: ${JSON.stringify(title)}
Author: ${JSON.stringify(authorName)}
Language code: ${JSON.stringify(language)}

${context}

Task: Infer when this poem was likely written or first published, using only well-known public facts.
Respond with ONLY valid JSON (no markdown), exactly this shape:
{"writtenYear": <integer 500-2100 or null>, "writtenPeriod": <short English label like "Victorian era" or "Early 20th century", or null>}

Rules:
- If you can give a likely year, set writtenYear and you may set writtenPeriod to null or a short era label.
- If only a broad period is known, set writtenYear to null and writtenPeriod to a short label.
- If you are not reasonably sure, set both to null. Do not invent precise years.`

  const model = process.env.ANTHROPIC_POEM_DATE_MODEL || 'claude-3-haiku-20240307'
  const msg = await client.messages.create({
    model,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content.find((b) => b.type === 'text')
  if (block?.type !== 'text') {
    return { writtenYear: null, writtenPeriod: null }
  }
  const parsed = parseLlmJson(block.text)
  if (!parsed) return { writtenYear: null, writtenPeriod: null }
  return {
    writtenYear: parsed.writtenYear,
    writtenPeriod: parsed.writtenPeriod?.trim() || null,
  }
}

export type EnrichPoemWrittenDateOptions = {
  anthropicApiKey?: string
}

/**
 * Fills `writtenYear` / `writtenPeriod` when missing; sets `writtenDateEnrichedAt` once per poem.
 */
export async function enrichPoemWrittenDateIfNeeded(
  poemId: string,
  options: EnrichPoemWrittenDateOptions = {},
): Promise<void> {
  const poem = await prisma.poem.findUnique({
    where: { id: poemId },
    include: { author: true },
  })
  if (!poem) return

  if (poem.writtenDateEnrichedAt) return
  const hasYear = poem.writtenYear != null
  const hasPeriod = Boolean(poem.writtenPeriod?.trim())
  if (hasYear && hasPeriod) {
    await prisma.poem.update({
      where: { id: poemId },
      data: { writtenDateEnrichedAt: new Date() },
    })
    return
  }

  const authorName = poem.author.name
  const birthYear = poem.author.birthYear ?? null
  const deathYear = poem.author.deathYear ?? null

  let writtenYear: number | null = hasYear ? poem.writtenYear : null
  let writtenPeriod: string | null = hasPeriod ? poem.writtenPeriod!.trim() : null

  try {
    const wiki = await enrichFromWikipedia(poem.title, authorName, poem.language, birthYear, deathYear)
    if (writtenYear == null && wiki.writtenYear != null) writtenYear = wiki.writtenYear
    if (writtenPeriod == null && wiki.writtenPeriod?.trim()) writtenPeriod = wiki.writtenPeriod.trim()

    const stillMissingYear = writtenYear == null
    const stillMissingPeriod = !writtenPeriod?.trim()
    const apiKey = options.anthropicApiKey?.trim()
    if (apiKey && (stillMissingYear || stillMissingPeriod)) {
      let wikiHint: string | null = null
      const host = wikiHostForLanguage(poem.language)
      const w = await fetchWikipediaExtract(host, `${poem.title} ${authorName}`)
      wikiHint = w?.extract ?? null
      if (!wikiHint) {
        const w2 = await fetchWikipediaExtract('en.wikipedia.org', `${poem.title} ${authorName}`)
        wikiHint = w2?.extract ?? null
      }
      const llm = await enrichFromAnthropic(apiKey, poem.title, authorName, poem.language, wikiHint)
      if (writtenYear == null && llm.writtenYear != null) writtenYear = llm.writtenYear
      if (writtenPeriod == null && llm.writtenPeriod?.trim()) writtenPeriod = llm.writtenPeriod.trim()
    }
  } catch {
    // Still mark attempt so we do not retry every request
  }

  const periodToSave = writtenPeriod?.trim() ?? ''
  await prisma.poem.update({
    where: { id: poemId },
    data: {
      ...(writtenYear != null && !hasYear ? { writtenYear } : {}),
      ...(periodToSave && !hasPeriod ? { writtenPeriod: periodToSave } : {}),
      writtenDateEnrichedAt: new Date(),
    },
  })
}
