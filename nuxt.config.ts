// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Keep current; bump occasionally per https://nuxt.com/docs/guide/going-further/features#compatibilitydate
  compatibilityDate: '2025-11-01',
  // On Node 24+, DevTools workers can load nitropack before Rollup resolves #nitro-internal-virtual/*.
  // Opt in: NUXT_DEVTOOLS=true nuxt dev
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' },

  // Bundle nitropack for SSR so Node never resolves raw #nitro-internal-virtual/* (fixes dev on Node 24+).
  vite: {
    ssr: {
      noExternal: ['nitropack'],
    },
  },

  // Avoid Vite "Failed to resolve import #app-manifest" pre-transform noise (nuxt/nuxt#30461).
  experimental: {
    appManifest: false,
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n'],

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
    // Public (client + server)
    public: {
      appName: 'PoetryHub',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  // Nitro config for Vercel serverless compatibility
  nitro: {
    preset: 'vercel',
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
            'O platformă modernă pentru a citi, descoperi și împărtăși poezie. Răsfoiește poezii clasice și generate de AI după stare, autor și temă.',
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
            + '&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400'
            + '&display=swap',
        },
      ],
    },
  },
})
