import type { Meta, StoryObj } from '@nuxtjs/storybook'
import type { Poem } from '~/composables/usePoems'
import PoetryCard from './PoetryCard.vue'

const samplePoem = {
  id: 'poem-1',
  title: 'Pe apele Dunării',
  slug: 'pe-apele-dunarii',
  content:
    'Pe apele Dunării la malul ei verde\nStă un stejar falnic și bătrân\nSub ramura-i rezemat un cioban\nCu fluierul cântând din nou',
  excerpt: null,
  authorId: 'author-1',
  language: 'ro',
  source: 'public',
  sourceUrl: null,
  readingTime: 2,
  writtenYear: 1881,
  writtenPeriod: null,
  featured: false,
  publishedAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  author: {
    id: 'author-1',
    name: 'Mihai Eminescu',
    slug: 'mihai-eminescu',
  },
  poemTags: [
    {
      tag: {
        id: 'tag-1',
        name: 'Melancolie',
        slug: 'melancholy',
        category: 'mood',
        color: '#6b5b95',
      },
    },
  ],
} satisfies Poem

const meta = {
  title: 'UI/PoetryCard',
  component: PoetryCard,
  tags: ['autodocs'],
  args: {
    poem: samplePoem,
    featured: false,
    layout: 'grid',
    view: 'grid',
    quickReadList: null,
  },
  argTypes: {
    featured: { control: 'boolean' },
    layout: { control: 'select', options: ['grid', 'masonry'] },
    view: { control: 'select', options: ['grid', 'list'] },
  },
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        const wide = context.args.view === 'list'
        return { wide }
      },
      template: `
        <div :class="wide ? 'w-full max-w-3xl' : 'w-full max-w-sm'">
          <story />
        </div>
      `,
    }),
  ],
} satisfies Meta<typeof PoetryCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Featured: Story = {
  args: {
    featured: true,
  },
  decorators: [
    () => ({
      template: '<div class="w-full max-w-md"><story /></div>',
    }),
  ],
}

export const ListView: Story = {
  args: {
    view: 'list',
  },
}

export const ForeignLanguage: Story = {
  args: {
    poem: {
      ...samplePoem,
      title: 'Demain, dès l’aube',
      slug: 'demain-des-laube',
      language: 'fr',
      writtenYear: 1856,
      author: {
        id: 'author-2',
        name: 'Victor Hugo',
        slug: 'victor-hugo',
      },
      content:
        'Demain, dès l’aube, à l’heure où blanchit la campagne,\nJe partirai. Vois-tu, je sais que tu m’attends.',
    },
  },
}
