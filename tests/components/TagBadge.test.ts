import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TagBadge from '~/components/TagBadge.vue'

describe('TagBadge', () => {
  it('shows fleuron when active', async () => {
    const wrapper = await mountSuspended(TagBadge, {
      props: { name: 'Melancolie', slug: 'melancholy', link: false, active: true },
    })
    expect(wrapper.text()).toContain('✦')
    expect(wrapper.text()).toContain('Melancolie')
    expect(wrapper.classes().join(' ')).toContain('bg-brand-tint')
  })

  it('renders inactive state without fleuron', async () => {
    const wrapper = await mountSuspended(TagBadge, {
      props: { name: 'Natură', slug: 'nature', link: false, active: false },
    })
    expect(wrapper.text()).not.toContain('✦')
    expect(wrapper.text()).toContain('Natură')
  })
})
