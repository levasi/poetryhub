/**
 * Localized tag labels by DB slug. Keys in locales: tags.<slug_with_underscores>
 * Unknown slugs fall back to the stored English `name`.
 */
export function tagMessageKey(slug: string) {
  return `tags.${slug.replace(/-/g, '_')}`
}

export function useTagLabel() {
  const { t, te } = useI18n()

  function labelForTag(slug: string, fallbackName: string) {
    const key = tagMessageKey(slug)
    return te(key) ? t(key) : fallbackName
  }

  return { labelForTag, tagMessageKey }
}
