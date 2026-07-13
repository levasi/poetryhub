// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  anagramKey,
  lettersOnly,
  parseSyllableInput,
  queryCorpus,
  sortWordRecordsByLength,
} from '~/lib/rhyme/wordQueries'
import { fixtureLexicon } from '../../../fixtures/lexicon'

describe('parseSyllableInput', () => {
  it('parses syllable separators', () => {
    expect(parseSyllableInput('ma · re')).toEqual(['ma', 're'])
    expect(parseSyllableInput('a, b | c')).toEqual(['a', 'b', 'c'])
  })
})

describe('lettersOnly / anagramKey', () => {
  it('strips non-letters for anagram signature', () => {
    expect(lettersOnly('Măr!')).toBe('mar')
    expect(anagramKey('arc')).toBe(anagramKey('car'))
  })
})

describe('sortWordRecordsByLength', () => {
  it('sorts by length then locale', () => {
    const sorted = sortWordRecordsByLength(fixtureLexicon)
    expect(sorted[0]!.word.length).toBeLessThanOrEqual(sorted[1]!.word.length)
  })
})

describe('queryCorpus', () => {
  const getFuse = () => null

  it('exact mode distinguishes diacritics when strict', () => {
    const hits = queryCorpus(fixtureLexicon, getFuse, 'exact', 'măr', 10, { strictDiacritics: true })
    expect(hits.map((h) => h.word)).toEqual(['măr'])
  })

  it('starts mode matches prefix', () => {
    const hits = queryCorpus(fixtureLexicon, getFuse, 'starts', 'ma', 10)
    expect(hits.map((h) => h.word)).toContain('mare')
    expect(hits.map((h) => h.word)).toContain('măr')
  })

  it('ends mode matches suffix', () => {
    const hits = queryCorpus(fixtureLexicon, getFuse, 'ends', 're', 10)
    expect(hits.map((h) => h.word)).toContain('mare')
    expect(hits.map((h) => h.word)).toContain('iubire')
  })

  it('anagram mode finds rearrangements', () => {
    const hits = queryCorpus(fixtureLexicon, getFuse, 'anagram', 'ram', 10)
    expect(hits.map((h) => h.word)).toContain('măr')
  })
})
