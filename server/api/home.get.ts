// GET /api/home — aggregated homepage payload (single client round-trip)
// Cached server-side for 60 s with stale-while-revalidate so repeat visitors
// never hit the database on every request.
import { getHomePagePayload } from '~/server/utils/homePagePayload'

export default defineCachedEventHandler(
  async () => {
    return await getHomePagePayload()
  },
  {
    maxAge: 60,
    staleMaxAge: 60,
    swr: true,
    name: 'home',
    getKey: () => 'home',
  },
)
