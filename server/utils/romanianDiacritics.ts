import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { standard } = require('js-romanian-diacritics') as { standard: (text: string) => string }

/**
 * Maps legacy / non-standard Romanian characters to official Unicode:
 * Ş/ş → Ș/ș, Ţ/ţ → Ț/ț, Ã/ã → Ă/ă.
 * Does not infer diacritics from plain ASCII.
 */
export function officialRomanianDiacritics(text: string): string {
  if (!text) return text
  return standard(text.normalize('NFC'))
}
