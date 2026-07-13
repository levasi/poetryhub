import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DsEmpty from '~/components/ds/DsEmpty.vue'

describe('DsEmpty', () => {
  it('renders title and optional description', async () => {
    const wrapper = await mountSuspended(DsEmpty, {
      props: {
        title: 'Nicio poezie',
        description: 'Salvează poezii din catalog.',
      },
    })
    expect(wrapper.text()).toContain('Nicio poezie')
    expect(wrapper.text()).toContain('Salvează poezii din catalog.')
  })

  it('renders default slot content', async () => {
    const wrapper = await mountSuspended(DsEmpty, {
      props: { title: 'Gol' },
      slots: { default: '<a href="/">Descoperă</a>' },
    })
    expect(wrapper.html()).toContain('Descoperă')
  })
})
