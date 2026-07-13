// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  isPoemEditorRole,
  isPoemEditorRoleOrSiteOwner,
  isSiteOwnerEmail,
  isStaffRole,
  normalizeRole,
  SITE_OWNER_EMAIL,
} from '~/utils/roles'

describe('roles', () => {
  it('identifies site owner email case-insensitively', () => {
    expect(isSiteOwnerEmail(SITE_OWNER_EMAIL)).toBe(true)
    expect(isSiteOwnerEmail(SITE_OWNER_EMAIL.toUpperCase())).toBe(true)
    expect(isSiteOwnerEmail('other@example.com')).toBe(false)
    expect(isSiteOwnerEmail('')).toBe(false)
  })

  it('normalizes unknown roles to user', () => {
    expect(normalizeRole('admin')).toBe('admin')
    expect(normalizeRole('moderator')).toBe('moderator')
    expect(normalizeRole('editor')).toBe('editor')
    expect(normalizeRole('guest')).toBe('user')
    expect(normalizeRole(null)).toBe('user')
  })

  it('classifies staff and poem editor roles', () => {
    expect(isStaffRole('admin')).toBe(true)
    expect(isStaffRole('moderator')).toBe(true)
    expect(isStaffRole('editor')).toBe(false)
    expect(isPoemEditorRole('editor')).toBe(true)
    expect(isPoemEditorRole('user')).toBe(false)
  })

  it('grants poem edit to site owner even as user', () => {
    expect(isPoemEditorRoleOrSiteOwner('user', SITE_OWNER_EMAIL)).toBe(true)
    expect(isPoemEditorRoleOrSiteOwner('user', 'x@y.com')).toBe(false)
  })
})
