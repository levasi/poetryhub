// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  getFetchErrorDataCode,
  getFetchErrorMessage,
  getFetchErrorStatus,
} from '~/utils/fetchApiError'

describe('fetchApiError', () => {
  describe('getFetchErrorStatus', () => {
    it('reads top-level statusCode', () => {
      expect(getFetchErrorStatus({ statusCode: 404 })).toBe(404)
    })

    it('reads nested data.statusCode', () => {
      expect(getFetchErrorStatus({ data: { statusCode: 403 } })).toBe(403)
    })

    it('returns undefined for non-objects', () => {
      expect(getFetchErrorStatus(null)).toBeUndefined()
      expect(getFetchErrorStatus('err')).toBeUndefined()
    })
  })

  describe('getFetchErrorDataCode', () => {
    it('reads code from root, data, or nested data.data', () => {
      expect(getFetchErrorDataCode({ code: 'RATE_LIMIT' })).toBe('RATE_LIMIT')
      expect(getFetchErrorDataCode({ data: { code: 'NOT_FOUND' } })).toBe('NOT_FOUND')
      expect(getFetchErrorDataCode({ data: { data: { code: 'FORBIDDEN' } } })).toBe('FORBIDDEN')
    })

    it('reads code from cause', () => {
      expect(getFetchErrorDataCode({ cause: { code: 'AUTH' } })).toBe('AUTH')
    })
  })

  describe('getFetchErrorMessage', () => {
    it('prefers data.statusMessage over top-level', () => {
      expect(
        getFetchErrorMessage({
          statusMessage: 'Bad',
          data: { statusMessage: 'Not found' },
        }),
      ).toBe('Not found')
    })

    it('falls back to top-level statusMessage', () => {
      expect(getFetchErrorMessage({ statusMessage: 'Unauthorized' })).toBe('Unauthorized')
    })

    it('ignores blank messages', () => {
      expect(getFetchErrorMessage({ statusMessage: '   ' })).toBeUndefined()
    })
  })
})
