// GET /api/home — aggregated homepage payload (single client round-trip)
import { getHomePagePayload } from '~/server/utils/homePagePayload'

export default defineEventHandler(async () => {
  return await getHomePagePayload()
})
