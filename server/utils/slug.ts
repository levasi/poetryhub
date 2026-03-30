// Generate URL-safe slugs from arbitrary strings
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_-]+/g, '-')   // collapse whitespace/underscores to hyphens
    .replace(/^-+|-+$/g, '')    // trim leading/trailing hyphens
}

// Append a short random suffix to ensure uniqueness when needed
export function uniqueSlug(text: string): string {
  const base = slugify(text)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}

// Estimate reading time in seconds (average 200 wpm, ~5 chars/word)
export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil((words / 200) * 60)
}

// Extract excerpt: first 2 non-empty lines
export function extractExcerpt(content: string, lines = 2): string {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join('\n')
}
