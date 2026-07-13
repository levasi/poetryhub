import type { Preview } from '@nuxtjs/storybook'
import '../assets/css/main.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div class="min-w-[16rem] bg-surface-page p-6 text-content" data-color-scheme="paper"><story /></div>',
    }),
  ],
}

export default preview
