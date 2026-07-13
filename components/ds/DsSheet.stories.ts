import type { Meta, StoryObj } from '@nuxtjs/storybook'
import { ref } from 'vue'
import DsSheet from './DsSheet.vue'

const meta = {
  title: 'DS/DsSheet',
  component: DsSheet,
  tags: ['autodocs'],
  args: {
    title: 'Setări lectură',
  },
} satisfies Meta<typeof DsSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: (args) => ({
    components: { DsSheet },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
      <div>
        <button type="button" class="ds-btn-secondary" @click="open = true">
          Deschide panoul
        </button>
        <DsSheet v-model:open="open" v-bind="args">
          <p class="text-ui-sm text-content-secondary">
            Exemplu de conținut în panou. Apasă Esc sau fundalul pentru a închide.
          </p>
        </DsSheet>
      </div>
    `,
  }),
}
