import { prisma } from '../utils/prisma'
import { patchWordDefinitionInCorpus } from '../utils/wordCorpus'
import { fetchWikipediaRoExtract } from '../utils/wikipediaRo'
import { fetchWiktionaryRoExtract } from '../utils/wiktionaryRo'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id?.toString()?.trim()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Parametrul id lipsește' })
  }

  const row = await prisma.writeLexiconWord.findUnique({ where: { id } })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Cuvânt negăsit' })
  }

  const existing = row.definition?.trim()
  if (existing && existing.length > 0) {
    return {
      word: row.word,
      definition: row.definition,
      source: 'db' as const,
    }
  }

  let fromWeb = await fetchWikipediaRoExtract(row.word)
  let webSource: 'wikipedia' | 'wiktionary' | null = fromWeb ? 'wikipedia' : null

  if (!fromWeb) {
    fromWeb = await fetchWiktionaryRoExtract(row.word)
    if (fromWeb) webSource = 'wiktionary'
  }

  if (fromWeb && webSource) {
    await prisma.writeLexiconWord.update({
      where: { id },
      data: { definition: fromWeb },
    })
    patchWordDefinitionInCorpus(id, fromWeb)
    return {
      word: row.word,
      definition: fromWeb,
      source: webSource,
    }
  }

  return {
    word: row.word,
    definition: null,
    source: 'none' as const,
  }
})
