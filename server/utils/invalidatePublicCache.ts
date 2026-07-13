/**
 * Clear Nitro handler caches after catalog mutations so
 * defineCachedEventHandler SWR entries do not serve stale data.
 *
 * Cache key shape matches nitropack `dist/runtime/internal/cache.mjs`.
 */
import { useStorage } from 'nitropack/runtime'

/** Must match Nitro cache `escapeKey` (non-word chars stripped). */
function escapeCacheKey(key: string) {
  return String(key).replace(/\W/g, '')
}

const HANDLER_BASE = '/cache:nitro/handlers'

function handlerStorageKey(handlerName: string, escapedKeyPart: string) {
  return `${HANDLER_BASE}:${handlerName}:${escapedKeyPart}.json`
}

async function removeKeysWithPrefix(prefix: string) {
  const storage = useStorage()
  const keys = await storage.getKeys(prefix)
  await Promise.all(keys.map((k) => storage.removeItem(k).catch(() => {})))
}

async function removeHandlerKey(handlerName: string, keyPart: string) {
  const storage = useStorage()
  await storage.removeItem(handlerStorageKey(handlerName, escapeCacheKey(keyPart))).catch(() => {})
}

/** Bust cached GET /api/home. */
export async function invalidateHomeCache() {
  await removeHandlerKey('home', 'home')
}

/** Bust all paginated GET /api/poems list variants. */
export async function invalidatePoemsListCaches() {
  await removeKeysWithPrefix(`${HANDLER_BASE}:api-poems-list:`)
}

/** Bust all paginated GET /api/authors list variants. */
export async function invalidateAuthorsListCaches() {
  await removeKeysWithPrefix(`${HANDLER_BASE}:api-authors-list:`)
}

/** Bust all GET /api/tags variants (all categories + filtered). */
export async function invalidateTagsListCaches() {
  await removeKeysWithPrefix(`${HANDLER_BASE}:api-tags:`)
}

/** Bust GET /api/site/settings. */
export async function invalidateSiteSettingsCache() {
  await removeHandlerKey('api-site-settings', 'settings')
}

/** Bust GET /api/carousel/defaults. */
export async function invalidateCarouselDefaultsCache() {
  await removeHandlerKey('api-carousel-defaults', 'defaults')
}

/** Homepage + poem/author list caches (after catalog-wide writes). */
export async function invalidateCatalogListCaches() {
  await Promise.all([
    invalidateHomeCache(),
    invalidatePoemsListCaches(),
    invalidateAuthorsListCaches(),
  ])
}

export type CatalogCacheScope = {
  home?: boolean
  poemsList?: boolean
  authorsList?: boolean
  tags?: boolean
  siteSettings?: boolean
  carouselDefaults?: boolean
  poemSlug?: string
  authorSlug?: string | string[]
}

/** Targeted public cache bust — only clears flags set to `true` plus optional slugs. */
export async function invalidateCatalogCaches(scope: CatalogCacheScope = {}) {
  const tasks: Promise<void>[] = []

  if (scope.home) tasks.push(invalidateHomeCache())
  if (scope.poemsList) tasks.push(invalidatePoemsListCaches())
  if (scope.authorsList) tasks.push(invalidateAuthorsListCaches())
  if (scope.tags) tasks.push(invalidateTagsListCaches())
  if (scope.siteSettings) tasks.push(invalidateSiteSettingsCache())
  if (scope.carouselDefaults) tasks.push(invalidateCarouselDefaultsCache())

  if (scope.poemSlug) {
    const slugs = Array.isArray(scope.poemSlug) ? scope.poemSlug : [scope.poemSlug]
    for (const slug of slugs) {
      if (slug?.trim()) tasks.push(invalidatePoemCaches(slug))
    }
  }

  if (scope.authorSlug) {
    const slugs = Array.isArray(scope.authorSlug) ? scope.authorSlug : [scope.authorSlug]
    for (const slug of slugs) {
      if (slug?.trim()) tasks.push(invalidateAuthorDetailCaches(slug))
    }
  }

  await Promise.all(tasks)
}

/** After poem content/title changes — bust single-poem GET + AI insight caches (otherwise edits look “unsaved”). */
export async function invalidatePoemCaches(slug: string) {
  await removeHandlerKey('api-poem-by-slug', `poem:${slug}`)
  await removeHandlerKey('api-poem-insight', `insight:${slug}`)
}

/** Bust cached GET /api/authors/:slug (pagination variants) after profile edits. */
export async function invalidateAuthorDetailCaches(authorSlug: string) {
  const trimmed = authorSlug.trim()
  if (!trimmed) return
  /** Matches Nitro `escapeKey` on handler cache keys built from `getKey` (`author:${slug}:…`). */
  const escapedPrefix = escapeCacheKey(`author:${trimmed}:`)
  const prefix = `${HANDLER_BASE}:api-author-by-slug:`
  const storage = useStorage()
  const keys = await storage.getKeys(prefix)
  for (const k of keys) {
    const segment = k.slice(prefix.length).replace(/\.json$/i, '')
    if (segment.startsWith(escapedPrefix)) await storage.removeItem(k).catch(() => {})
  }
}

/**
 * After an author is removed: drop homepage, authors list, poems list, that
 * author’s paginated GET caches, and per-poem caches for cascade-deleted poems.
 */
export async function invalidateCachesAfterAuthorDelete(slug: string, poemSlugs: string[]) {
  await invalidateCatalogListCaches()
  await invalidateAuthorDetailCaches(slug)
  for (const ps of poemSlugs) {
    await invalidatePoemCaches(ps)
  }
}
