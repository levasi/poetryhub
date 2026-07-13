import type { Meta, StoryObj } from '@nuxtjs/storybook'
import TagBadge from './TagBadge.vue'

const meta = {
  title: 'UI/TagBadge',
  component: TagBadge,
  tags: ['autodocs'],
  args: {
    name: 'Melancolie',
    slug: 'melancholy',
    link: false,
    clickable: true,
    active: false,
    color: null,
  },
  argTypes: {
    link: { control: 'boolean' },
    clickable: { control: 'boolean' },
    active: { control: 'boolean' },
    color: { control: 'color' },
  },
} satisfies Meta<typeof TagBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Active: Story = {
  args: {
    active: true,
  },
}

export const CustomColor: Story = {
  args: {
    name: 'Natură',
    slug: 'nature',
    color: '#4a7c59',
  },
}

export const AsLink: Story = {
  args: {
    link: true,
    slug: 'love',
    name: 'Dragoste',
  },
}
