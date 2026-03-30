/** Deterministic DiceBear portrait URL (matches UI fallback when `imageUrl` is empty). */
export function dicebearAuthorUrl(slug: string, name?: string): string {
  const seed = encodeURIComponent(slug?.trim() || name?.trim() || 'author')
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f5f5f0`
}

/**
 * Resolved avatar URL for an author: custom photo when set, otherwise a
 * deterministic generated portrait (DiceBear) from the slug.
 */
export function authorAvatarUrl(
  author?: {
    imageUrl?: string | null
    slug: string
    name: string
  } | null,
): string {
  if (!author) {
    return 'https://api.dicebear.com/7.x/notionists/svg?seed=unknown&backgroundColor=f5f5f0'
  }
  const url = author.imageUrl?.trim()
  if (url) return url
  return dicebearAuthorUrl(author.slug, author.name)
}
