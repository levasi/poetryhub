import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AuthorCard from '~/components/AuthorCard.vue'

const author = {
  id: 'a1',
  name: 'Mihai Eminescu',
  slug: 'mihai-eminescu',
  bio: 'Poet național',
  nationality: 'Romanian',
  birthYear: 1850,
  deathYear: 1889,
  imageUrl: null,
  _count: { poems: 12 },
}

describe('AuthorCard', () => {
  it('renders author name and normalized nationality', async () => {
    const wrapper = await mountSuspended(AuthorCard, { props: { author } })
    expect(wrapper.text()).toContain('Mihai Eminescu')
    expect(wrapper.text()).toContain('Român')
    expect(wrapper.text()).toContain('Poet național')
  })

  it('links to author page', async () => {
    const wrapper = await mountSuspended(AuthorCard, { props: { author } })
    expect(wrapper.find('a').attributes('href')).toContain('/authors/mihai-eminescu')
  })
})
