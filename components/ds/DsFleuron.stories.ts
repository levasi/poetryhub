import type { Meta, StoryObj } from '@nuxtjs/storybook'
import DsFleuron from './DsFleuron.vue'

const meta = {
  title: 'DS/DsFleuron',
  component: DsFleuron,
  tags: ['autodocs'],
} satisfies Meta<typeof DsFleuron>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Narrow: Story = {
  args: { width: '5rem' },
}
