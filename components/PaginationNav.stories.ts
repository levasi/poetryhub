import type { Meta, StoryObj } from '@nuxtjs/storybook'
import { ref, watch } from 'vue'
import PaginationNav from './PaginationNav.vue'

const meta = {
  title: 'UI/PaginationNav',
  component: PaginationNav,
  tags: ['autodocs'],
  args: {
    page: 3,
    totalPages: 12,
    loading: false,
  },
} satisfies Meta<typeof PaginationNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FewPages: Story = {
  args: {
    page: 2,
    totalPages: 5,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const Interactive: Story = {
  render: (args) => ({
    components: { PaginationNav },
    setup() {
      const page = ref(args.page)
      watch(
        () => args.page,
        (v) => {
          page.value = v
        },
      )
      return { args, page }
    },
    template: `
      <PaginationNav
        :page="page"
        :total-pages="args.totalPages"
        :loading="args.loading"
        @update:page="page = $event"
      />
    `,
  }),
  args: {
    page: 1,
    totalPages: 8,
  },
}
