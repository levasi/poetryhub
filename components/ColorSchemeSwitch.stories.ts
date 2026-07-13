import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ColorSchemeSwitch from './ColorSchemeSwitch.vue'

const meta = {
  title: 'UI/ColorSchemeSwitch',
  component: ColorSchemeSwitch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Reading-theme picker. Persists via localStorage and syncs to the user account when signed in.',
      },
    },
  },
} satisfies Meta<typeof ColorSchemeSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OnInkBackground: Story = {
  decorators: [
    () => ({
      template:
        '<div class="rounded-ds-lg bg-surface-page p-6 text-content" data-color-scheme="ink"><story /></div>',
    }),
  ],
}
