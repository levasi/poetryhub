import type { Poem } from '~/composables/usePoems'

export const fixturePoem: Poem = {
  id: 'poem-1',
  slug: 'luceafarul',
  title: 'Luceafărul',
  content: 'A fost odată ca-n povești\nO fată frumoasă ca-n zori',
  excerpt: null,
  authorId: 'author-1',
  language: 'ro',
  writtenYear: 1883,
  writtenPeriod: null,
  publishedAt: '2020-01-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
  featured: false,
  source: 'catalog',
  sourceUrl: null,
  readingTime: 3,
  author: {
    id: 'author-1',
    name: 'Mihai Eminescu',
    slug: 'mihai-eminescu',
    imageUrl: null,
  },
  poemTags: [
    {
      tag: {
        id: 'tag-1',
        name: 'Melancolie',
        slug: 'melancholy',
        category: 'mood',
        color: '#6b5b4f',
      },
    },
  ],
}
