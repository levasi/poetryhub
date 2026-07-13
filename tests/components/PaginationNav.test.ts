import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PaginationNav from '~/components/PaginationNav.vue'

describe('PaginationNav', () => {
  it('renders page buttons and emits update on click', async () => {
    const wrapper = await mountSuspended(PaginationNav, {
      props: { page: 2, totalPages: 5 },
    })

    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('5')

    const pageThree = wrapper.findAll('button').find((b) => b.text() === '3')
    expect(pageThree).toBeTruthy()
    await pageThree!.trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([3])
  })

  it('disables previous on first page', async () => {
    const wrapper = await mountSuspended(PaginationNav, {
      props: { page: 1, totalPages: 4 },
    })
    const prev = wrapper.findAll('button')[0]!
    expect(prev.attributes('disabled')).toBeDefined()
  })

  it('hides when only one page', async () => {
    const wrapper = await mountSuspended(PaginationNav, {
      props: { page: 1, totalPages: 1 },
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
