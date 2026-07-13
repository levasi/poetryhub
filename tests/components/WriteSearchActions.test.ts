import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import WriteSearchActions from '~/components/write/WriteSearchActions.vue'

describe('WriteSearchActions', () => {
  it('disables search until canSearch is true', async () => {
    const wrapper = await mountSuspended(WriteSearchActions, {
      props: { canSearch: false, loading: false },
    })
    const btn = wrapper.get('[data-testid="write-search-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('enables search and emits on click', async () => {
    const wrapper = await mountSuspended(WriteSearchActions, {
      props: { canSearch: true, loading: false },
    })
    await wrapper.get('[data-testid="write-search-btn"]').trigger('click')
    expect(wrapper.emitted('search')).toHaveLength(1)
  })

  it('emits diacritic insert', async () => {
    const wrapper = await mountSuspended(WriteSearchActions, {
      props: { canSearch: true, loading: false },
    })
    const buttons = wrapper.findAll('[data-testid="diacritic-btn"]')
    expect(buttons).toHaveLength(5)
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('insertDiacritic')?.[0]).toEqual(['ă'])
  })

  it('disables search while loading', async () => {
    const wrapper = await mountSuspended(WriteSearchActions, {
      props: { canSearch: true, loading: true },
    })
    expect(wrapper.get('[data-testid="write-search-btn"]').attributes('disabled')).toBeDefined()
  })
})
