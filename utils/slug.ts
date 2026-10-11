/** Romanian (and related) diacritics → ASCII for URL slugs. */
const DIACRITIC_MAP: Record<string, string> = {
  ă: 'a',
  â: 'a',
  î: 'i',
  ș: 's',
  ş: 's',
  ț: 't',
  ţ: 't',
  á: 'a',
  à: 'a',
  é: 'e',
  è: 'e',
  í: 'i',
  ó: 'o',
  ö: 'o',
  ú: 'u',
  ü: 'u',
}

export function foldSlugDiacritics(s: string): string {
  let out = ''
  for (const ch of s.toLowerCase()) {
    out += DIACRITIC_MAP[ch] ?? ch
  }
  return out
}

/** URL-safe kebab slug; folds Romanian diacritics first. */
export function slugify(text: string): string {
  return foldSlugDiacritics(text)
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
