// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { userCanEditPoem } from '~/server/utils/poemEditAuth'
import { SITE_OWNER_EMAIL } from '~/utils/roles'

describe('userCanEditPoem', () => {
  const poem = { submittedByUserId: 'user-1' }

  it('allows poem editors and staff', () => {
    expect(userCanEditPoem({ id: 'x', role: 'editor' }, poem)).toBe(true)
    expect(userCanEditPoem({ id: 'x', role: 'admin' }, poem)).toBe(true)
    expect(userCanEditPoem({ id: 'x', role: 'moderator' }, poem)).toBe(true)
  })

  it('allows site owner regardless of role', () => {
    expect(userCanEditPoem({ id: 'x', role: 'user', email: SITE_OWNER_EMAIL }, poem)).toBe(true)
  })

  it('allows submitter to edit own poem only', () => {
    expect(userCanEditPoem({ id: 'user-1', role: 'user' }, poem)).toBe(true)
    expect(userCanEditPoem({ id: 'user-2', role: 'user' }, poem)).toBe(false)
  })

  it('denies when poem has no submitter and user is not staff', () => {
    expect(userCanEditPoem({ id: 'user-1', role: 'user' }, { submittedByUserId: null })).toBe(false)
  })
})
