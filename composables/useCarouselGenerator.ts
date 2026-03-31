/**
 * Instagram carousel (1080×1350, 4:5 portrait) — slide splitting, captions, PNG export helpers.
 * Client-only: call export functions from onMounted or user gestures (uses html2canvas + JSZip).
 */

export type CarouselTheme = 'minimal' | 'dark' | 'gradient' | 'neon'

export type SlideVariant = 'cover' | 'body' | 'cta'

export interface CarouselSlideModel {
  kind: SlideVariant
  lines?: string[]
}

/** Body slides pack up to this many verse lines (two quatrains). */
export const CAROUSEL_LINES_PER_BODY_SLIDE = 8

export interface SplitPoemOptions {
  /** Max verse lines per slide (default {@link CAROUSEL_LINES_PER_BODY_SLIDE}) */
  maxLinesPerSlide?: number
}

/** Portrait feed size (4:5) */
export const CAROUSEL_WIDTH = 1080
export const CAROUSEL_HEIGHT = 1350

/** @deprecated Use CAROUSEL_WIDTH — kept for older imports */
export const CAROUSEL_SIZE = CAROUSEL_WIDTH

export const CAROUSEL_SAFE_PADDING = 56

/** Golden ratio φ — carousel cover typography and vertical rhythm. */
export const PHI = 1.618033988749895

/**
 * Vertical spacing (px) for cover slides: step 0 = base unit, 1 = φ×base, 2 = φ²×base.
 * Base is tuned for a more open first-slide layout (avatar → title → rule → author → tag).
 */
export function coverGoldenSpacingPx(titleScale: number, step: 0 | 1 | 2): number {
  const base = 30 * titleScale
  return Math.round(base * PHI ** step)
}

/** Secondary line (author) size from primary title size using golden ratio. */
export function goldenSecondaryPxFromTitle(titlePx: number): number {
  return Math.round(titlePx / PHI)
}

/** Compact lifespan for cover slide (en dash between years). */
export function formatAuthorLifespan(
  birthYear?: number | null,
  deathYear?: number | null,
): string {
  if (birthYear != null && deathYear != null) return `${birthYear}–${deathYear}`
  if (birthYear != null) return `${birthYear}–`
  if (deathYear != null) return `?–${deathYear}`
  return ''
}

/**
 * Cover portrait diameter (square crop, `object-cover`) from title size.
 * Uses φ^3.85 so the portrait stays prominent while matching the golden ladder with {@link coverGoldenSpacingPx}.
 */
export function coverAvatarDiameterPxFromTitle(titlePx: number): number {
  return Math.round(titlePx * PHI ** 3.85)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Splits poem text into body slides: keeps the same line sequence as the textarea (every `\n`
 * becomes a row; blank lines are kept as empty strings). Rows are packed up to `maxLinesPerSlide`
 * entries per slide, then rebalanced to avoid a lonely last row when possible.
 */
export function splitPoemIntoSlides(poemText: string, opts?: SplitPoemOptions): string[][] {
  const max = opts?.maxLinesPerSlide ?? CAROUSEL_LINES_PER_BODY_SLIDE
  const text = poemText.replace(/\r\n/g, '\n')
  if (!text.trim()) return []

  const lines = text.split('\n')
  const chunks = chunkLinesBalanced(lines, max)
  return rebalanceOrphans(chunks, max)
}

/** Greedy chunks with orphan balance; avoids weak splits (e.g. 4+1 with max 4 → 3+2; 8+1 with max 8 → 5+4). */
function chunkLinesBalanced(lines: string[], max: number): string[][] {
  if (lines.length <= max) return lines.length ? [lines] : []

  const out: string[][] = []
  let i = 0
  while (i < lines.length) {
    const left = lines.length - i
    if (left <= max) {
      out.push(lines.slice(i))
      break
    }
    // Prefer 3+2 over 4+1 when five lines remain (max 4)
    if (left === 5 && max === 4) {
      out.push(lines.slice(i, i + 3))
      i += 3
      continue
    }
    // Prefer (max−3)+(3) over max+1 when (max+1) lines remain (e.g. 5+4 vs 8+1 for max 8)
    if (left === max + 1 && max >= 5) {
      out.push(lines.slice(i, i + max - 3))
      i += max - 3
      continue
    }
    out.push(lines.slice(i, i + max))
    i += max
  }
  return out
}

/** Move a line from penultimate slide to last if last has only one line */
function rebalanceOrphans(slides: string[][], max: number): string[][] {
  if (slides.length < 2) return slides
  const last = slides[slides.length - 1]
  const prev = slides[slides.length - 2]
  if (last.length !== 1 || prev.length < 2) return slides
  if (prev.length + last.length <= max) {
    return [...slides.slice(0, -2), [...prev, ...last]]
  }
  // Split prev: give one line to last slide
  const moved = prev[prev.length - 1]
  const newPrev = prev.slice(0, -1)
  return [...slides.slice(0, -2), newPrev, [moved, ...last]]
}

export function buildCarouselSlides(poemText: string, opts?: SplitPoemOptions): CarouselSlideModel[] {
  const body = splitPoemIntoSlides(poemText, opts)
  const slides: CarouselSlideModel[] = [{ kind: 'cover' }]
  for (const lines of body) {
    slides.push({ kind: 'body', lines })
  }
  slides.push({ kind: 'cta' })
  return slides
}

export interface FontScaleForBodyOptions {
  /** Matches “lines per slide” so auto-scale tightens when a slide is full. */
  linesPerSlide?: number
}

/** Auto scale (0.65–1) from longest line so long verses still fit 1080px width; slightly tighter when a slide is full. */
export function fontScaleForBody(lines: string[] | undefined, opts?: FontScaleForBodyOptions): number {
  if (!lines?.length) return 1
  const perSlide = opts?.linesPerSlide ?? CAROUSEL_LINES_PER_BODY_SLIDE
  const maxLen = Math.max(0, ...lines.map((l) => l.length))
  let s = 1
  if (maxLen >= 95) s = 0.68
  else if (maxLen >= 75) s = 0.76
  else if (maxLen >= 58) s = 0.84
  else if (maxLen >= 45) s = 0.92
  if (lines.length >= perSlide) s *= 0.9
  return s
}

export function fontScaleForTitle(title: string): number {
  const len = title.length
  if (len >= 52) return 0.72
  if (len >= 38) return 0.82
  if (len >= 28) return 0.9
  return 1
}

export function slideFilename(poemTitle: string, slideIndex: number): string {
  const base = slugify(poemTitle) || 'poem'
  return `${base}-slide-${slideIndex + 1}.png`
}

/** Instagram caption: title, author, first lines, hashtags */
export function buildInstagramCaption(title: string, author: string, poemText: string, appHandle = '@poetryhub'): string {
  const excerpt = poemText
    .trim()
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join('\n')
  return `${title}\n— ${author}\n\n${excerpt}${poemText.length > 400 ? '\n…' : ''}\n\n${appHandle}\n#poezie #poetry #versuri`
}

/** Split line into segments for keyword highlighting (case-insensitive) */
export function highlightSegments(line: string, keywords: string[]): Array<{ text: string; mark: boolean }> {
  const cleaned = keywords.map((k) => k.trim()).filter(Boolean)
  if (!cleaned.length) return [{ text: line, mark: false }]

  const escaped = cleaned.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts: Array<{ text: string; mark: boolean }> = []
  let last = 0
  let m: RegExpExecArray | null
  const s = line
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index), mark: false })
    parts.push({ text: m[0], mark: true })
    last = m.index + m[0].length
  }
  if (last < s.length) parts.push({ text: s.slice(last), mark: false })
  return parts.length ? parts : [{ text: line, mark: false }]
}

export interface ExportSlideToPngOptions {
  /** html2canvas scale; 2 = sharper but larger file (default 2 for retina) */
  scale?: number
  backgroundColor?: string | null
}

export async function elementToPngBlob(
  el: HTMLElement,
  opts?: ExportSlideToPngOptions,
): Promise<Blob> {
  if (import.meta.server) throw new Error('elementToPngBlob is client-only')
  const html2canvas = (await import('html2canvas')).default
  await document.fonts.ready
  const scale = opts?.scale ?? 2
  const canvas = await html2canvas(el, {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    scale,
    backgroundColor: opts?.backgroundColor ?? null,
    logging: false,
    useCORS: true,
    allowTaint: true,
  })
  const out = document.createElement('canvas')
  out.width = CAROUSEL_WIDTH
  out.height = CAROUSEL_HEIGHT
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('2d context')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, CAROUSEL_WIDTH, CAROUSEL_HEIGHT)
  return new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

export async function blobsToZipDownload(
  files: Array<{ name: string; blob: Blob }>,
  zipName: string,
): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  for (const f of files) zip.file(f.name, f.blob)
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
