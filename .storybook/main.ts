import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@nuxtjs/storybook'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { mergeConfig } from 'vite'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const nuxtDevPort = Number(process.env.NUXT_PORT || process.env.PORT || 3000)
/** @storybook-vue/nuxt default proxy route for Nuxt dev assets */
const nuxtProxyRoute = '^/(_nuxt|_ipx|api/_nuxt_icon|__nuxt_devtools__|__nuxt_island)'

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      css: {
        postcss: {
          plugins: [
            tailwindcss({ config: resolve(rootDir, 'tailwind.config.ts') }),
            autoprefixer(),
          ],
        },
      },
      server: {
        proxy: {
          // Use 127.0.0.1 (not localhost) to avoid Node dual-stack EAGAIN proxy errors.
          [nuxtProxyRoute]: {
            target: `http://127.0.0.1:${nuxtDevPort}`,
            changeOrigin: true,
            secure: false,
            ws: true,
          },
        },
      },
    })
  },
}

export default config
