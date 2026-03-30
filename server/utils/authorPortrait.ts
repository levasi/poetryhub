import { prisma } from '~/server/utils/prisma'
import { fetchWikipediaPortraitUrlForAuthor } from '~/server/utils/wikipediaPortrait'

/**
 * If the author has no photo, try Wikipedia and persist the first trusted image URL.
 * Returns the effective image URL (existing or newly saved), or null.
 */
export async function ensureAuthorPortraitUrl(author: {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}): Promise<string | null> {
  const existing = author.imageUrl?.trim()
  if (existing) return existing

  const url = await fetchWikipediaPortraitUrlForAuthor(author.name, author.slug)
  if (!url) return null

  await prisma.author.update({
    where: { id: author.id },
    data: { imageUrl: url },
  })
  return url
}

/** Merge resolved portrait into an author object for API responses. */
export async function withResolvedAuthorPortrait<
  T extends { id: string; name: string; slug: string; imageUrl: string | null },
>(author: T): Promise<T> {
  const imageUrl = await ensureAuthorPortraitUrl(author)
  return imageUrl ? { ...author, imageUrl } : author
}
