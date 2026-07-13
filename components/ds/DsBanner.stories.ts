import type { Meta, StoryObj } from '@nuxtjs/storybook'
import DsBanner from './DsBanner.vue'

const meta = {
  title: 'DS/DsBanner',
  component: DsBanner,
  tags: ['autodocs'],
  args: {
    variant: 'info',
    title: 'Sfat pentru lectură',
  },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'danger'] },
  },
} satisfies Meta<typeof DsBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  render: (args) => ({
    components: { DsBanner },
    setup() {
      return { args }
    },
    template: `
      <DsBanner v-bind="args" class="max-w-md">
        Poți schimba tema de lectură din panoul „Aa” sau din setările contului.
      </DsBanner>
    `,
  }),
}

export const Success: Story = {
  args: { variant: 'success', title: 'Poezie publicată' },
  render: (args) => ({
    components: { DsBanner },
    setup() {
      return { args }
    },
    template: `
      <DsBanner v-bind="args" class="max-w-md">
        „Lacul” este acum vizibil în catalog.
      </DsBanner>
    `,
  }),
}

export const Danger: Story = {
  args: { variant: 'danger', title: 'Nu am putut salva' },
  render: (args) => ({
    components: { DsBanner },
    setup() {
      return { args }
    },
    template: `
      <DsBanner v-bind="args" class="max-w-md">
        Verifică conexiunea și încearcă din nou.
      </DsBanner>
    `,
  }),
}
