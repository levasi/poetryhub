export function displayNationality(nationality?: string | null): string | null {
  if (!nationality) return null
  const raw = nationality.trim()
  if (!raw) return null

  const normalized = raw.toLowerCase()

  // Normalize common English variants to Romanian display.
  if (normalized === 'romanian' || normalized === 'romania' || normalized === 'romanians') {
    return 'Român'
  }

  // Common typo / casing variants.
  if (normalized === 'romana' || normalized === 'română' || normalized === 'român') {
    return 'Român'
  }

  return raw
}

