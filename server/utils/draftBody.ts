/** Shared draft body validation for Write → Save. */
import { z } from 'zod'

export const draftSavedWordsSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(200)
  .default([])

export const draftBodySchema = z.object({
  title: z.string().min(1).max(500).trim(),
  authorName: z.string().min(1).max(80).trim(),
  language: z.string().default('ro'),
  content: z.string().max(500_000).trim(),
  savedWords: draftSavedWordsSchema,
})

export function normalizeSavedWords(value: unknown): string[] {
  const parsed = draftSavedWordsSchema.safeParse(value)
  if (!parsed.success) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const w of parsed.data) {
    const low = w.toLowerCase()
    if (seen.has(low)) continue
    seen.add(low)
    out.push(w)
  }
  return out
}
