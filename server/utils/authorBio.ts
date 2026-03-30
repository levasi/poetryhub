import { prisma } from '~/server/utils/prisma'
import { fetchWikipediaBiographyForAuthor } from '~/server/utils/wikipediaPortrait'

/**
 * If the author has no biography, try Wikipedia summary extract and persist it.
 * Returns the effective bio text, or null.
 */
export async function ensureAuthorBio(author: {
  id: string
  name: string
  slug: string
  bio: string | null
}): Promise<string | null> {
  const existing = author.bio?.trim()
  if (existing) return existing

  const text = await fetchWikipediaBiographyForAuthor(author.name, author.slug)
  if (!text) return null

  const bio = `${text}\n\n— Wikipedia · CC BY-SA 3.0`

  await prisma.author.update({
    where: { id: author.id },
    data: { bio },
  })
  return bio
}
