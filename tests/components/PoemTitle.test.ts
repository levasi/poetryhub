import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PoemTitle from '~/components/PoemTitle.vue'

describe('PoemTitle', () => {
  it('renders title as h1 on pdp variant', async () => {
    const wrapper = await mountSuspended(PoemTitle, {
      props: { title: 'Luceafărul', slug: 'luceafarul', variant: 'pdp' },
    })
    expect(wrapper.find('h1').text()).toBe('Luceafărul')
  })

  it('renders title as h3 on banner variant', async () => {
    const wrapper = await mountSuspended(PoemTitle, {
      props: { title: 'Revista', slug: 'revista', variant: 'banner' },
    })
    expect(wrapper.find('h3').text()).toBe('Revista')
  })

  it('hides carousel icon when showCarousel is false', async () => {
    const wrapper = await mountSuspended(PoemTitle, {
      props: {
        title: 'Test',
        slug: 'test',
        variant: 'pdp',
        showCarousel: false,
      },
    })
    expect(wrapper.findComponent({ name: 'PoemCarouselIcon' }).exists()).toBe(false)
  })
})
