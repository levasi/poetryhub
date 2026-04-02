/** Wikipedia (Romanian): REST summary + MediaWiki extracts fallback. */

const UA =
  'RhymeScheme/1.0 (https://github.com/; Romanian dictionary; educational use)'

function restSummaryUrl(title: string): string {
  const t = title.trim().replace(/ /g, '_')
  return `https://ro.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`
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

async function tryMediaWikiExtracts(title: string): Promise<string | null> {
  const api = new URL('https://ro.wikipedia.org/w/api.php')
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
 * Returns plain-text extract from ro.wikipedia, or null if no suitable page.
 */
export async function fetchWikipediaRoExtract(word: string): Promise<string | null> {
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
