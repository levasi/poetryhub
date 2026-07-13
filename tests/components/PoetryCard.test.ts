import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PoetryCard from '~/components/PoetryCard.vue'
import { fixturePoem } from '../fixtures/poem'

describe('PoetryCard', () => {
  it('renders poem title and author in grid view', async () => {
    const wrapper = await mountSuspended(PoetryCard, {
      props: { poem: fixturePoem },
    })
    expect(wrapper.text()).toContain('Luceafărul')
    expect(wrapper.text()).toContain('Mihai Eminescu')
    expect(wrapper.text()).toContain('A fost odată')
  })

  it('renders list view layout', async () => {
    const wrapper = await mountSuspended(PoetryCard, {
      props: { poem: fixturePoem, view: 'list' },
    })
    expect(wrapper.find('article').exists()).toBe(true)
    expect(wrapper.text()).toContain('Luceafărul')
  })

  it('shows written year next to title', async () => {
    const wrapper = await mountSuspended(PoetryCard, {
      props: { poem: fixturePoem },
    })
    expect(wrapper.text()).toContain('1883')
  })
})
