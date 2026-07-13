import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@nuxtjs/storybook'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
    return {
      ...viteConfig,
      css: {
        ...viteConfig.css,
        postcss: {
          plugins: [
            tailwindcss({ config: resolve(rootDir, 'tailwind.config.ts') }),
            autoprefixer(),
          ],
        },
      },
    }
  },
}

export default config
