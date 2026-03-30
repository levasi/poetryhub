// Hydrate user auth state from cookie on every page load
export default defineNuxtPlugin(async () => {
  const { fetchMe } = useAuth()
  await fetchMe()
})
