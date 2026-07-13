export default defineNuxtPlugin({
  name: 'color-scheme',
  dependsOn: ['auth'],
  setup() {
    useColorScheme()
  },
})
