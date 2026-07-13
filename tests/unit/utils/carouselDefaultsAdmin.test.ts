// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  isCarouselSiteOwnerEmail,
  resolveCarouselDefaultsAdminEmail,
  userCanManageCarouselDefaults,
} from '~/utils/carouselDefaultsAdmin'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

describe('carouselDefaultsAdmin', () => {
  it('resolves admin email from runtime or falls back to site owner', () => {
    expect(resolveCarouselDefaultsAdminEmail('  Admin@Example.com  ')).toBe('admin@example.com')
    expect(resolveCarouselDefaultsAdminEmail('')).toBe(SITE_OWNER_EMAIL)
  })

  it('checks carousel site owner email', () => {
    expect(isCarouselSiteOwnerEmail(SITE_OWNER_EMAIL)).toBe(true)
    expect(isCarouselSiteOwnerEmail('other@test.com')).toBe(false)
  })

  it('allows staff or configured owner to manage defaults', () => {
    expect(userCanManageCarouselDefaults({ email: 'a@b.com', role: 'admin' })).toBe(true)
    expect(userCanManageCarouselDefaults({ email: 'a@b.com', role: 'moderator' })).toBe(true)
    expect(userCanManageCarouselDefaults({ email: SITE_OWNER_EMAIL, role: 'user' })).toBe(true)
    expect(userCanManageCarouselDefaults({ email: 'x@y.com', role: 'user' })).toBe(false)
  })
})
