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

  const slugSeg = slug.replace(/[^a-zA-Z0-9]/g, '')
  const authorSegmentRe = new RegExp(`^author${slugSeg}p`)
  const authorPrefix = `${HANDLER_BASE}:api-author-by-slug:`
  const authorKeys = await storage.getKeys(authorPrefix)
  for (const k of authorKeys) {
    const segment = k.split(':').pop()?.replace(/\.json$/i, '') ?? ''
    if (authorSegmentRe.test(segment)) await storage.removeItem(k).catch(() => {})
  }

  for (const ps of poemSlugs) {
    const poemKey = escapeCacheKey(`poem:${ps}`)
    await storage.removeItem(handlerStorageKey('api-poem-by-slug', poemKey)).catch(() => {})
    const insightKey = escapeCacheKey(`insight:${ps}`)
    await storage.removeItem(handlerStorageKey('api-poem-insight', insightKey)).catch(() => {})
  }
}
