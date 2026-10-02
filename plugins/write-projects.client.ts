/** Clear legacy write-projects localStorage and mark the store ready after mount. */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    void useWriteProjectsStore().init()
  })
})
