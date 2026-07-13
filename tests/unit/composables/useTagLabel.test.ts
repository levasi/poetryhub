// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { tagMessageKey } from '~/composables/useTagLabel'

describe('tagMessageKey', () => {
  it('maps slug to i18n key with underscores', () => {
    expect(tagMessageKey('love-poetry')).toBe('tags.love_poetry')
    expect(tagMessageKey('nature')).toBe('tags.nature')
  })
})
