/** Hydrate auth on server + client so SSR HTML matches hydration (see useAuth + useRequestFetch). */
export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'pre',
  async setup() {
    const { fetchMe } = useAuth()
    await fetchMe()
  },
})
