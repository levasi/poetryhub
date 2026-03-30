/**
 * Resolves SSR runtime import `#internal/nuxt/paths` when Node loads
 * `.nuxt/dist/server/server.mjs` (see package.json "imports").
 */
export * from './node_modules/@nuxt/nitro-server/dist/runtime/utils/paths.mjs'
