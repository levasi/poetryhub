import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppLogo from '~/components/AppLogo.vue'

describe('AppLogo', () => {
  it('renders wordmark with brand accent', async () => {
    const wrapper = await mountSuspended(AppLogo)
    expect(wrapper.text()).toContain('Poetry')
    expect(wrapper.text()).toContain('Hub')
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('hides mark when showMark is false', async () => {
    const wrapper = await mountSuspended(AppLogo, { props: { showMark: false } })
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('applies small size class', async () => {
    const wrapper = await mountSuspended(AppLogo, { props: { size: 'sm' } })
    expect(wrapper.find('span.font-serif').classes()).toContain('text-lg')
  })
})
