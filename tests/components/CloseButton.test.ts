import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CloseButton from '~/components/CloseButton.vue'

describe('CloseButton', () => {
  it('renders accessible label and emits click', async () => {
    const wrapper = await mountSuspended(CloseButton, {
      props: { label: 'Close panel' },
    })
    const btn = wrapper.get('button')
    expect(btn.attributes('aria-label')).toBe('Close panel')
    await btn.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('respects disabled state', async () => {
    const wrapper = await mountSuspended(CloseButton, {
      props: { label: 'Close', disabled: true },
    })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
