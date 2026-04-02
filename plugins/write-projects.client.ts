export default defineNuxtPlugin(async () => {
  await useWriteProjectsStore().init()
})
