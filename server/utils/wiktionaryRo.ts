/** Wiktionary (Romanian): REST summary + MediaWiki extracts fallback. */

const UA =
  'RhymeScheme/1.0 (https://github.com/; Romanian dictionary; educational use)'

function restSummaryUrl(title: string): string {
  const t = title.trim().replace(/ /g, '_')
  return `https://ro.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`
}

function titleCandidates(word: string): string[] {
  const base = word.trim()
  if (!base) return []
  const out: string[] = []
  const push = (s: string) => {
    if (s && !out.includes(s)) out.push(s)
  }
  push(base)
  const cap = base.charAt(0).toUpperCase() + base.slice(1)
  push(cap)
  const low = base.toLowerCase()
  push(low)
  const capLow = low.charAt(0).toUpperCase() + low.slice(1)
  push(capLow)
  return out
}

async function tryRestSummary(title: string): Promise<string | null> {
  try {
    const res = await fetch(restSummaryUrl(title), {
      headers: { 'User-Agent': UA },
    })
    if (res.status === 404 || !res.ok) return null
    const data = (await res.json()) as {
      type?: string
      extract?: string
    }
    if (data.type === 'disambiguation') return null
    const ext = data.extract
    if (typeof ext === 'string' && ext.trim().length > 0) {
      return ext.trim().slice(0, 4000)
    }
  } catch {
    /* fall through */
  }
  return null
}

/**
 * MediaWiki TextExtracts — full page extract (no `exintro`), so content under
 * ==Romanian== / ==Română== is included. REST summary often omits these.
 */
async function tryMediaWikiExtracts(title: string): Promise<string | null> {
  const api = new URL('https://ro.wiktionary.org/w/api.php')
  api.searchParams.set('action', 'query')
  api.searchParams.set('format', 'json')
  api.searchParams.set('formatversion', '2')
  api.searchParams.set('titles', title)
  api.searchParams.set('prop', 'extracts')
  api.searchParams.set('explaintext', '1')
  api.searchParams.set('exchars', '4000')
  api.searchParams.set('redirects', '1')

  try {
    const res = await fetch(api.toString(), {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      query?: {
        pages?: Array<{
          missing?: boolean
          extract?: string
        }>
      }
    }
    const pages = data.query?.pages
    if (!pages?.length) return null
    const page = pages[0]
    if (page?.missing) return null
    const ext = page?.extract
    if (typeof ext === 'string' && ext.trim().length > 0) {
      return ext.trim().slice(0, 4000)
    }
  } catch {
    /* ignore */
  }
  return null
}

async function tryTitle(title: string): Promise<string | null> {
  const rest = await tryRestSummary(title)
  if (rest) return rest
  return tryMediaWikiExtracts(title)
}

/**
 * Returns plain-text extract from ro.wiktionary, or null if no suitable page.
 */
export async function fetchWiktionaryRoExtract(word: string): Promise<string | null> {
  const candidates = titleCandidates(word)
  const tried = new Set<string>()

  for (const title of candidates) {
    if (tried.has(title)) continue
    tried.add(title)
    const text = await tryTitle(title)
    if (text) return text
  }
  return null
}

function uniq<T>(arr: T[]): T[] {
  const out: T[] = []
  const seen = new Set<T>()
  for (const x of arr) {
    if (seen.has(x)) continue
    seen.add(x)
    out.push(x)
  }
  return out
}

function isBulletLine(s: string): boolean {
  const t = s.trim()
  return t.startsWith('*') || t.startsWith('-') || t.startsWith('•')
}

function splitListText(s: string): string[] {
  const cleaned = s
    .replace(/^[*\-•]\s*/g, '')
    .replace(/\[[^\]]+\]/g, ' ') // defensive: leftover refs
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return []
  // Common separators in RO wiktionary lists.
  const parts = cleaned
    .split(/[,;·•]|(?:\s+și\s+)|(?:\s+sau\s+)/gi)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts
}

function normalizeRelationToken(s: string): string | null {
  let t = s
    .trim()
    .replace(/^["'„”“]+|["'„”“]+$/g, '')
    .replace(/^\d+\s*[:.)-]\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return null
  // Strip common register/usage markers at the start (often produced by "(înv. și pop.) X").
  // Keep the core word if present.
  for (let i = 0; i < 3; i++) {
    const next = t.replace(
      /^(?:(?:livr|înv|inv|pop|rar|reg|fig|fam|coloc|arg|pej|vulg)\.)\s+/i,
      '',
    )
    if (next === t) break
    t = next.trim()
  }
  // Drop leftover standalone markers like "înv." or "pop.".
  if (/^(?:livr|înv|inv|pop|rar|reg|fig|fam|coloc|arg|pej|vulg)\.$/i.test(t)) return null
  // Keep only tokens that contain at least one letter.
  if (!/\p{L}/u.test(t)) return null
  // Drop very long / sentence-like chunks.
  if (t.length > 60) return null
  return t
}

function collectSectionList(lines: string[], startIdx: number): { items: string[]; endIdx: number } {
  const items: string[] = []
  let i = startIdx
  // Consume optional blank lines.
  while (i < lines.length && !lines[i]!.trim()) i++

  for (; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const t = line.trim()
    if (!t) {
      // Stop once we already collected something and hit a blank line.
      if (items.length) break
      continue
    }
    // Stop on what looks like a new section heading (single short word/phrase).
    if (!isBulletLine(t) && items.length && /^[A-ZĂÂÎȘȚ][\p{L} \-]{0,40}$/u.test(t)) break

    if (isBulletLine(t)) {
      for (const p of splitListText(t)) {
        const tok = normalizeRelationToken(p)
        if (tok) items.push(tok)
      }
      continue
    }

    // Inline lists sometimes continue as plain text.
    if (items.length === 0) {
      for (const p of splitListText(t)) {
        const tok = normalizeRelationToken(p)
        if (tok) items.push(tok)
      }
      // Keep reading until blank line / heading to allow multi-line inline lists.
      continue
    }
  }

  return { items: uniq(items).slice(0, 80), endIdx: i }
}

export function parseWiktionaryRoRelations(extractText: string): { synonyms: string[]; antonyms: string[] } {
  const lines = extractText.split(/\r?\n/)
  const synonyms: string[] = []
  const antonyms: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ''
    const t = raw.trim()
    if (!t) continue

    // Wiktionary headings often look like "==== Sinonime ====".
    const heading = t.replace(/^=+|=+$/g, '').trim()

    const m = t.match(/^(Sinonime|Antonime)\s*:\s*(.*)$/i)
    if (m) {
      const kind = m[1]!.toLowerCase()
      const rest = m[2] ?? ''
      const tokens: string[] = []
      for (const p of splitListText(rest)) {
        const tok = normalizeRelationToken(p)
        if (tok) tokens.push(tok)
      }
      const target = kind === 'sinonime' ? synonyms : antonyms
      target.push(...tokens)
      continue
    }

    if (/^Sinonime$/i.test(heading) || /^Antonime$/i.test(heading)) {
      const kind = heading.toLowerCase()
      const { items, endIdx } = collectSectionList(lines, i + 1)
      const target = kind === 'sinonime' ? synonyms : antonyms
      target.push(...items)
      i = Math.max(i, endIdx - 1)
    }
  }

  return {
    synonyms: uniq(synonyms).slice(0, 80),
    antonyms: uniq(antonyms).slice(0, 80),
  }
}

export async function fetchWiktionaryRoRelations(
  word: string,
): Promise<{ synonyms: string[]; antonyms: string[] } | null> {
  const extract = await fetchWiktionaryRoExtract(word)
  if (!extract) return null
  const rel = parseWiktionaryRoRelations(extract)
  if (!rel.synonyms.length && !rel.antonyms.length) return null
  return rel
}
