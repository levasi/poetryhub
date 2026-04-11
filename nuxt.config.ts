// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import { resolve } from 'node:path'
import { CAROUSEL_DEFAULTS_ADMIN_EMAIL } from './utils/carouselDefaultsAdmin'

/** Nitro virtual imports are not real package exports; they must be bundled, not loaded by Node. */
const BUNDLE_NOT_EXTERNAL = ['nitropack/runtime', 'nitro/runtime'] as const

const NITRO_SHIMS_DIR = resolve(process.cwd(), 'nitropack-shims')

function shouldBundleNitropackRuntimeId(id: string): boolean {
  if (id === 'nitropack/runtime' || id.startsWith('nitropack/runtime/')) return true
  const norm = id.replace(/\\/g, '/')
  if (norm.includes('/node_modules/nitropack/') && norm.includes('/dist/runtime')) return true
  return false
}

function shouldForceBundleRollupExternal(id: string): boolean {
  if (shouldBundleNitropackRuntimeId(id)) return true
  if (id === 'nitro/runtime' || id.startsWith('nitro/runtime/')) return true
  return BUNDLE_NOT_EXTERNAL.includes(id as (typeof BUNDLE_NOT_EXTERNAL)[number])
}

/** Rollup `external: [...]` does not run `shouldForceBundle` on resolved file paths; wrap as a function. */
function matchesRollupExternalArray(id: string, matchers: unknown[]): boolean {
  for (const e of matchers) {
    if (typeof e === 'string') {
      if (e === id || id.startsWith(`${e}/`)) return true
      continue
    }
    if (e instanceof RegExp && e.test(id)) return true
  }
  return false
}

function patchRollupExternals(rollupOptions: { external?: unknown } | undefined) {
  if (!rollupOptions?.external) return
  const ext = rollupOptions.external
  if (Array.isArray(ext)) {
    const matchers = [...ext]
    rollupOptions.external = (id: string, importer?: string, isResolved?: boolean) => {
      if (shouldForceBundleRollupExternal(id)) return false
      return matchesRollupExternalArray(id, matchers)
    }
    return
  }
  if (typeof ext === 'function') {
    const prev = ext as (id: string, importer?: string, isResolved?: boolean) => boolean | void
    rollupOptions.external = (id: string, importer?: string, isResolved?: boolean) => {
      if (shouldForceBundleRollupExternal(id)) return false
      return Boolean(prev(id, importer, isResolved))
    }
  }
}

function patchServerViteConfig(config: import('vite').UserConfig) {
  patchRollupExternals(config.build?.rollupOptions)
  // Vite 7 environment API: SSR Rollup options live under `environments.<name>.build`.
  const ssrRo = config.environments?.ssr?.build?.rollupOptions
  if (ssrRo) patchRollupExternals(ssrRo)
  if (config.environments) {
    for (const env of Object.values(config.environments)) {
      if (env && typeof env === 'object' && 'build' in env) {
        patchRollupExternals(env.build?.rollupOptions)
      }
    }
  }
}

/**
 * Nitropack's config.mjs uses `process.env.RUNTIME_CONFIG`; Nitro's Rollup replaces that at Nitro build time.
 * When Vite bundles nitropack for SSR, the placeholder is left as-is → undefined → `.nitro` throws.
 * Inject the merged Nuxt runtimeConfig as a JSON object literal (same as Nitro replace).
 *
 * Populated synchronously in module `setup` (before Vite SSR transforms nitropack). A late
 * `modules:done` refresh keeps the object in sync if anything mutates runtimeConfig after modules load.
 * Do not call `useNuxt()` inside Vite `transform` (it runs outside Nuxt context).
 */
const minimalNitroInlineRuntimeConfig: Record<string, unknown> = {
  nitro: {
    envPrefix: 'NITRO_',
    envExpansion: false,
  },
}

let nitroInlineRuntimeConfig: Record<string, unknown> | null = null

function injectNitropackRuntimeConfig(): import('vite').Plugin {
  return {
    name: 'poetryhub:nitropack-runtime-config',
    enforce: 'pre',
    transform(code, id) {
      const normalized = id.replace(/\\/g, '/')
      if (!normalized.includes('/nitropack/dist/runtime/internal/config.mjs')) return null
      if (!code.includes('process.env.RUNTIME_CONFIG')) return null
      const rc = nitroInlineRuntimeConfig ?? minimalNitroInlineRuntimeConfig
      const inlined = JSON.stringify(rc)
      return code.replace(
        'const _inlineRuntimeConfig = process.env.RUNTIME_CONFIG',
        `const _inlineRuntimeConfig = ${inlined}`,
      )
    },
  }
}

function cacheNitroInlineRuntimeConfig(nuxt: { options: { runtimeConfig: Record<string, unknown> } }) {
  nitroInlineRuntimeConfig = defu(nuxt.options.runtimeConfig, minimalNitroInlineRuntimeConfig) as Record<
    string,
    unknown
  >
}

/** Must run before Vite can transform nitropack SSR deps; `modules:done` refreshes late mutations. */
const poetryhubNitroRuntimeCache = defineNuxtModule({
  meta: { name: 'poetryhub-nitro-runtime-cache' },
  setup(_options, nuxt) {
    cacheNitroInlineRuntimeConfig(nuxt)
    nuxt.hooks.hook('modules:done', () => {
      cacheNitroInlineRuntimeConfig(nuxt)
    })
  },
})

/**
 * Resolve Nitro virtual imports to real files so Vite can bundle them (never hit Node raw).
 */
function nitropackVirtualShimPlugin(): import('vite').Plugin {
  return {
    name: 'poetryhub:nitropack-virtual-shims',
    enforce: 'pre',
    resolveId(id) {
      if (id === '#nitro-internal-virtual/error-handler') {
        return resolve(NITRO_SHIMS_DIR, 'error-handler.mjs')
      }
      if (id === '#nitro-internal-virtual/plugins') {
        return resolve(NITRO_SHIMS_DIR, 'plugins.mjs')
      }
      if (id === '#nitro-internal-virtual/server-handlers') {
        return resolve(NITRO_SHIMS_DIR, 'server-handlers.mjs')
      }
      if (id === '#nitro-internal-virtual/app-config') {
        return resolve(NITRO_SHIMS_DIR, 'app-config.mjs')
      }
    },
  }
}

/**
 * Vite 7 applies SSR Rollup options via `configEnvironment('ssr', …)` after root `config`.
 * Nuxt hooks can miss the final merge; this plugin strips nitropack from `external` for SSR only.
 */
function nitropackSsrBundlePlugin(): import('vite').Plugin {
  return {
    name: 'poetryhub:bundle-nitropack-ssr',
    enforce: 'post',
    configEnvironment(name, config) {
      if (name !== 'ssr') return
      patchRollupExternals(config.build?.rollupOptions)
    },
    configResolved(config) {
      const ssr = config.environments?.ssr
      if (ssr && typeof ssr === 'object' && 'build' in ssr) {
        patchRollupExternals(ssr.build?.rollupOptions)
      }
      if (config.build?.ssr) {
        patchRollupExternals(config.build?.rollupOptions)
      }
    },
  }
}

export default defineNuxtConfig({
  /**
   * Default `localhost` so the URL matches typical browser bookmarks and auth cookies (host-only).
   * If you need IPv4-only HMR, set `NUXT_DEV_SERVER_HOST=127.0.0.1` and always open that URL
   * (localhost vs 127.0.0.1 are different origins for cookies).
   */
  devServer: {
    host: process.env.NUXT_DEV_SERVER_HOST || 'localhost',
  },

  build: {
    // Ensures nitropack is inlined for SSR (same intent as vite.ssr.noExternal; helps merge order with Nuxt internals).
    transpile: ['nitropack', '@nuxt/nitro-server'],
  },

  // Keep current; bump occasionally per https://nuxt.com/docs/guide/going-further/features#compatibilitydate
  compatibilityDate: '2025-11-01',
  // Opt in: NUXT_DEVTOOLS=true nuxt dev
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' },

  // Nuxt marks `nitropack/runtime` as Rollup external for the SSR server chunk. Node then loads
  // nitropack/dist/runtime/internal/app.mjs directly, which imports #nitro-internal-virtual/* — those
  // only exist after Nitro's bundler resolves them, so Node throws ERR_PACKAGE_IMPORT_NOT_DEFINED.
  // Bundling nitropack into the server output avoids raw runtime imports (common on Node 20–24).
  hooks: {
    'vite:extendConfig'(config, ctx) {
      if (!ctx.isServer) return
      patchServerViteConfig(config)
    },
    'vite:configResolved'(config, ctx) {
      if (!ctx.isServer) return
      patchServerViteConfig(config)
    },
  },

  vite: {
    server: {
      watch: {
        // Do not ignore `.nuxt` — Nuxt watches `.nuxt/dist`; ignoring it can cause restart loops / false "dist removed" messages.
        ignored: ['**/node_modules/**', '**/.git/**', '**/.output/**'],
      },
    },
    plugins: [
      injectNitropackRuntimeConfig(),
      nitropackVirtualShimPlugin(),
      nitropackSsrBundlePlugin(),
    ],
    ssr: {
      // Strings + regex so every subpath (e.g. nitropack/runtime/app) stays in the SSR bundle.
      noExternal: [
        'nitropack',
        '@nuxt/nitro-server',
        /^nitropack(\/|$)/,
        /^@nuxt\/nitro-server(\/|$)/,
      ],
    },
  },

  // Avoid Vite "Failed to resolve import #app-manifest" pre-transform noise (nuxt/nuxt#30461).
  experimental: {
    appManifest: false,
    // Vite 7 defaults this on in some setups; legacy SSR bundling path can avoid nitropack being left as raw Node externals.
    viteEnvironmentApi: false,
  },

  modules: [poetryhubNitroRuntimeCache, '@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'ro', language: 'ro-RO', name: 'Română', file: 'ro.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    langDir: 'locales',
    restructureDir: 'i18n',
    defaultLocale: 'ro',
    strategy: 'no_prefix',
    // No Accept-Language redirect — first visit is always Romanian; switching locale persists for the session
    detectBrowserLanguage: false,
  },

  css: ['~/assets/css/main.css'],

  // Runtime config — public values exposed to client, private to server only
  runtimeConfig: {
    // Private (server-only)
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@poetryhub.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    poetryDbUrl: process.env.POETRY_DB_URL || 'https://poetrydb.org',
    /** Optional: improves poem date enrichment when Wikipedia has no extract */
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    /**
     * Google OAuth client ID (server). Same value may be duplicated in
     * NUXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID so the login button is visible when
     * the ID is only injected at deploy time (e.g. Vercel) without a rebuild.
     */
    oauthGoogleClientId:
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || process.env.NUXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID || '',
    oauthGoogleClientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || '',
    // Public (client + server)
    public: {
      appName: 'PoetryHub',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      /** “Continue with Google” when a client ID is configured (see oauthGoogleClientId). */
      googleSignInEnabled: Boolean(
        process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || process.env.NUXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID,
      ),
      /** Email allowed to save site-wide Instagram carousel defaults (theme, font, verse layout, CTA, keywords). */
      carouselDefaultsAdminEmail:
        process.env.NUXT_PUBLIC_CAROUSEL_DEFAULTS_ADMIN_EMAIL || CAROUSEL_DEFAULTS_ADMIN_EMAIL,
    },
  },

  // Nitro config for Vercel serverless compatibility
  nitro: {
    preset: 'vercel',
  },

  /** Long cache for hashed build assets; public APIs use Nitro `defineCachedEventHandler` in server routes. */
  routeRules: {
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/favicon.svg': { headers: { 'cache-control': 'public, max-age=86400' } },
  },

  // App-level meta
  app: {
    head: {
      title: 'PoetryHub — Citește, descoperă și împărtășește poezie',
      htmlAttrs: { lang: 'ro' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'O platformă modernă pentru a citi, descoperi și împărtăși poezie. Răsfoiește poezii clasice după stare, autor și temă.',
        },
        { name: 'theme-color', content: '#f5f5f0' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // Google Fonts — elegant serif + mono stack
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'stylesheet',
          href:
            'https://fonts.googleapis.com/css2'
            + '?family=Crimson+Pro:ital,wght@0,400;0,600;1,400'
            + '&family=EB+Garamond:ital,wght@0,400;0,600;1,400'
            + '&family=Inter:wght@400;500;600'
            + '&family=JetBrains+Mono:wght@400'
            + '&family=Literata:ital,wght@0,400;0,600;1,400'
            + '&family=Lora:ital,wght@0,400;0,600;1,400'
            + '&family=Merriweather:ital,wght@0,400;0,700;1,400'
            + '&family=Noto+Serif:ital,wght@0,400;0,600;1,400'
            + '&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400'
            + '&family=Roboto:ital,wght@0,400;0,500;1,400'
            + '&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400'
            + '&display=swap',
        },
      ],
    },
  },
})
