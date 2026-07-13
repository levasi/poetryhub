import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FilterPanel from '~/components/FilterPanel.vue'

const moodTags = [{ id: '1', name: 'Melancolie', slug: 'melancholy', color: '#333' }]
const themeTags = [{ id: '2', name: 'Natură', slug: 'nature', color: '#444' }]

describe('FilterPanel', () => {
  it('emits apply when mood tag clicked', async () => {
    const wrapper = await mountSuspended(FilterPanel, {
      props: {
        moodTags,
        themeTags,
        filters: {},
        hasActiveFilters: false,
      },
    })
    const tag = wrapper.findAll('span').find((el) => el.text().includes('Melancolie'))
    expect(tag).toBeTruthy()
    await tag!.trigger('click')
    expect(wrapper.emitted('apply')?.[0]).toEqual([{ tag: 'melancholy' }])
  })

  it('emits clear when clear button visible', async () => {
    const wrapper = await mountSuspended(FilterPanel, {
      props: {
        moodTags,
        themeTags,
        filters: { tag: 'melancholy' },
        hasActiveFilters: true,
      },
    })
    const clearBtn = wrapper.findAll('button').find((b) => b.classes().includes('w-full'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
