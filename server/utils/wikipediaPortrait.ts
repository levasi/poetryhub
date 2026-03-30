/**
 * Resolve a portrait image URL for a person from Wikipedia (REST summary thumbnail).
 * Tries English then Romanian wiki; uses page summary and OpenSearch fallbacks.
 * Uses global fetch (Node 18+ / Nitro) with a descriptive User-Agent per Wikimedia guidance.
 */

const WIKIS = ['en', 'ro'] as const

const UA = 'PoetryHub/1.0 (author portraits; open-source)'

function normalizeHttps(url: string): string {
  if (url.startsWith('//')) return `https:${url}`
  return url
}

/** Only persist URLs we trust (Wikimedia image hosts). */
export function isTrustedPortraitUrl(url: string): boolean {
  try {
    const u = new URL(normalizeHttps(url))
    return u.hostname === 'upload.wikimedia.org' || u.hostname.endsWith('.wikimedia.org')
  } catch {
    return false
  }
}

function titleForPath(title: string): string {
  return title.trim().replace(/\s+/g, '_')
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function getSummaryThumbnail(
  wiki: (typeof WIKIS)[number],
  title: string,
): Promise<string | null> {
  const path = encodeURIComponent(titleForPath(title))
  const url = `https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${path}`
  const data = await fetchJson<{ type?: string; thumbnail?: { source?: string } }>(url)
  if (!data) return null
  if (data.type === 'disambiguation') return null
  const src = data.thumbnail?.source
  if (!src || !isTrustedPortraitUrl(src)) return null
  return normalizeHttps(src)
}

async function openSearchTitles(wiki: (typeof WIKIS)[number], search: string): Promise<string[]> {
  const q = search.trim()
  if (!q) return []
  const params = new URLSearchParams({
    action: 'opensearch',
    search: q,
    limit: '5',
    namespace: '0',
    format: 'json',
  })
  const url = `https://${wiki}.wikipedia.org/w/api.php?${params}`
  const data = await fetchJson<[string, string[]]>(url)
  if (!data) return []
  const titles = data[1]
  return Array.isArray(titles) ? titles : []
}

/**
 * Returns a Wikimedia thumbnail URL for the given person name, or null if none found.
 */
export async function fetchWikipediaPortraitUrl(name: string): Promise<string | null> {
  const q = name.trim()
  if (!q) return null

  for (const wiki of WIKIS) {
    const direct = await getSummaryThumbnail(wiki, q)
    if (direct) return direct

    const titles = await openSearchTitles(wiki, q)
    for (const title of titles) {
      const thumb = await getSummaryThumbnail(wiki, title)
      if (thumb) return thumb
    }
  }

  return null
}

function slugToSearchQuery(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Tries the display name first, then a query derived from the URL slug (hyphens → spaces),
 * for authors whose stored name doesn’t match a Wikipedia article title.
 */
export async function fetchWikipediaPortraitUrlForAuthor(
  name: string,
  slug: string,
): Promise<string | null> {
  const fromName = await fetchWikipediaPortraitUrl(name)
  if (fromName) return fromName
  const fromSlug = slugToSearchQuery(slug)
  if (!fromSlug || fromSlug.toLowerCase() === name.trim().toLowerCase()) return null
  return fetchWikipediaPortraitUrl(fromSlug)
}

// ── Biography (REST summary extract) ─────────────────────────────────────

async function getSummaryExtract(
  wiki: (typeof WIKIS)[number],
  title: string,
): Promise<string | null> {
  const path = encodeURIComponent(titleForPath(title))
  const url = `https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${path}`
  const data = await fetchJson<{ type?: string; extract?: string }>(url)
  if (!data) return null
  if (data.type === 'disambiguation') return null
  const ex = data.extract?.trim()
  return ex && ex.length > 40 ? ex : null
}

/** Short plain-text biography from Wikipedia page summary (English, then Romanian). */
export async function fetchWikipediaBiography(name: string): Promise<string | null> {
  const q = name.trim()
  if (!q) return null

  for (const wiki of WIKIS) {
    const direct = await getSummaryExtract(wiki, q)
    if (direct) return direct

    const titles = await openSearchTitles(wiki, q)
    for (const title of titles) {
      const ex = await getSummaryExtract(wiki, title)
      if (ex) return ex
    }
  }

  return null
}

export async function fetchWikipediaBiographyForAuthor(
  name: string,
  slug: string,
): Promise<string | null> {
  const fromName = await fetchWikipediaBiography(name)
  if (fromName) return fromName
  const fromSlug = slugToSearchQuery(slug)
  if (!fromSlug || fromSlug.toLowerCase() === name.trim().toLowerCase()) return null
  return fetchWikipediaBiography(fromSlug)
}
