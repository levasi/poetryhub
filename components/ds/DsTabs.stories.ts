import type { Meta, StoryObj } from '@nuxtjs/storybook'
import { ref } from 'vue'
import DsTabs from './DsTabs.vue'
import DsTab from './DsTab.vue'

const meta = {
  title: 'DS/DsTabs',
  component: DsTabs,
  tags: ['autodocs'],
} satisfies Meta<typeof DsTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Editorial: Story = {
  render: () => ({
    components: { DsTabs, DsTab },
    setup() {
      const active = ref<'forYou' | 'featured'>('forYou')
      return { active }
    },
    template: `
      <DsTabs label="Flux principal">
        <DsTab :active="active === 'forYou'" @click="active = 'forYou'">
          Pentru tine
        </DsTab>
        <DsTab :active="active === 'featured'" @click="active = 'featured'">
          Alese de redacție
        </DsTab>
      </DsTabs>
    `,
  }),
}
