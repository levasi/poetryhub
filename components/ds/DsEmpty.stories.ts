import type { Meta, StoryObj } from '@nuxtjs/storybook'
import DsEmpty from './DsEmpty.vue'

const meta = {
  title: 'DS/DsEmpty',
  component: DsEmpty,
  tags: ['autodocs'],
  args: {
    title: 'Încă n-ai salvat nicio poezie.',
    description: 'Atinge ♡ pe orice poezie ca s-o păstrezi aici.',
  },
} satisfies Meta<typeof DsEmpty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { DsEmpty },
    setup() {
      return { args }
    },
    template: `
      <DsEmpty v-bind="args">
        <button type="button" class="ds-btn-secondary">Descoperă poezii</button>
      </DsEmpty>
    `,
  }),
}
