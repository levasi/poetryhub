// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { authorAvatarUrl, dicebearAuthorUrl } from '~/utils/authorAvatar'

describe('authorAvatar', () => {
  it('builds dicebear URL from slug', () => {
    const url = dicebearAuthorUrl('eminescu', 'Mihai Eminescu')
    expect(url).toContain('api.dicebear.com')
    expect(url).toContain('seed=eminescu')
  })

  it('uses custom imageUrl when set', () => {
    expect(
      authorAvatarUrl({
        slug: 'eminescu',
        name: 'Eminescu',
        imageUrl: 'https://cdn.example/photo.jpg',
      }),
    ).toBe('https://cdn.example/photo.jpg')
  })

  it('falls back to dicebear for missing author or image', () => {
    expect(authorAvatarUrl(null)).toContain('seed=unknown')
    expect(
      authorAvatarUrl({ slug: 'test', name: 'Test', imageUrl: '  ' }),
    ).toContain('seed=test')
  })
})
