// GET /api/home/roll — single round-trip for the dice roll: random author + poem
// Returns the same shape as HomePayload.hero: { a, p } | null
import { buildHomeHero } from '~/server/utils/homePagePayload'

export default defineEventHandler(async () => {
  const hero = await buildHomeHero()
  if (!hero) {
    throw createError({ statusCode: 404, statusMessage: 'No content available' })
  }
  return hero
})
