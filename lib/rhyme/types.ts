export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'other'

export type RhymeKind = 'exact' | 'near' | 'loose'

export interface WordRecord {
  id: string
  word: string
  baseForm: string
  type: WordType | string
  syllables: string
  syllableCount: number
  endingKey: string
  endingLast: string
  definition: string | null
  synonyms: string[]
}

export interface RhymeMatch extends WordRecord {
  score: number
  rhymeKind: RhymeKind
}

/** Max rhyme matches returned per request (top-ranked). */
export const RHYME_RESULT_LIMIT = 5000

export interface RhymeFilters {
  /** exact = strict endings; near = + approximate; both = + loose */
  rhymeType: 'exact' | 'near' | 'both'
  minSyllables: number
  maxSyllables: number
  wordType: WordType | 'any'
  maxLength: number
  limit: number
}
