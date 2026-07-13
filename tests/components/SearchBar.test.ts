import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SearchBar from '~/components/SearchBar.vue'

describe('SearchBar', () => {
  it('emits search on form submit', async () => {
    const wrapper = await mountSuspended(SearchBar, {
      props: { modelValue: 'eminescu' },
    })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('search')?.[0]).toEqual(['eminescu'])
  })

  it('shows clear button when value is set and emits clear', async () => {
    const wrapper = await mountSuspended(SearchBar, {
      props: { modelValue: 'test' },
    })
    const clearBtn = wrapper.find('button[type="button"]')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('updates model on input', async () => {
    const wrapper = await mountSuspended(SearchBar, {
      props: { modelValue: '' },
    })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('poezie')
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['poezie'])
  })
})
