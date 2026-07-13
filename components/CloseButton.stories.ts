import type { Meta, StoryObj } from '@nuxtjs/storybook'
import CloseButton from './CloseButton.vue'

const meta = {
  title: 'UI/CloseButton',
  component: CloseButton,
  tags: ['autodocs'],
  args: {
    label: 'Închide',
    size: 'sm',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof CloseButton>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {}

export const Medium: Story = {
  args: { size: 'md' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
