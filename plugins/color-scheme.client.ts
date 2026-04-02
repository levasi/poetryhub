export default defineNuxtPlugin(() => {
  const { hydrate } = useColorScheme()
  hydrate()
})
