// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getRhymes } from '~/lib/rhyme/rhymeEngine'
import { fixtureLexicon } from '../../../fixtures/lexicon'

describe('getRhymes', () => {
  it('finds exact rhymes for mare', () => {
    const matches = getRhymes('mare', fixtureLexicon, {
      rhymeType: 'exact',
      minSyllables: 1,
      maxSyllables: 6,
      wordType: 'any',
      maxLength: 32,
      limit: 20,
    })
    const words = matches.map((m) => m.word)
    expect(words).not.toContain('mare')
    expect(words).not.toContain('iubire')
  })

  it('returns empty for blank input', () => {
    expect(
      getRhymes('  ', fixtureLexicon, {
        rhymeType: 'both',
        minSyllables: 1,
        maxSyllables: 6,
        wordType: 'any',
        maxLength: 32,
        limit: 10,
      }),
    ).toEqual([])
  })
})
