/**
 * Clear Nitro handler caches after author (and cascade poems) deletion so
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

/** After poem content/title changes — bust single-poem GET + AI insight caches (otherwise edits look “unsaved”). */
export async function invalidatePoemCaches(slug: string) {
  const poemKey = escapeCacheKey(`poem:${slug}`)
  const insightKey = escapeCacheKey(`insight:${slug}`)
  const storage = useStorage()
  await storage.removeItem(handlerStorageKey('api-poem-by-slug', poemKey)).catch(() => {})
  await storage.removeItem(handlerStorageKey('api-poem-insight', insightKey)).catch(() => {})
}

/** Bust cached GET /api/authors/:slug (pagination variants) after profile edits. */
export async function invalidateAuthorDetailCaches(authorSlug: string) {
  const slugSeg = authorSlug.replace(/[^a-zA-Z0-9]/g, '')
  const re = new RegExp(`^author${slugSeg}`)
  const prefix = `${HANDLER_BASE}:api-author-by-slug:`
  const storage = useStorage()
  const keys = await storage.getKeys(prefix)
  for (const k of keys) {
    const segment = k.split(':').pop()?.replace(/\.json$/i, '') ?? ''
    if (re.test(segment)) await storage.removeItem(k).catch(() => {})
  }
}

async function removeKeysWithPrefix(prefix: string) {
  const storage = useStorage()
  const keys = await storage.getKeys(prefix)
  await Promise.all(keys.map((k) => storage.removeItem(k)))
}

/**
 * After an author is removed: drop homepage, authors list, poems list, that
 * author’s paginated GET caches, and per-poem caches for cascade-deleted poems.
 */
export async function invalidateCachesAfterAuthorDelete(slug: string, poemSlugs: string[]) {
  const storage = useStorage()

  await storage.removeItem(handlerStorageKey('home', 'home')).catch(() => {})

  await removeKeysWithPrefix(`${HANDLER_BASE}:api-authors-list:`)
  await removeKeysWithPrefix(`${HANDLER_BASE}:api-poems-list:`)

  await invalidateAuthorDetailCaches(slug)

  for (const ps of poemSlugs) {
    await invalidatePoemCaches(ps)
  }
}
