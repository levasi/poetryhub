/** Explicit separator between editor verse cards — blank lines inside a card stay intact. */
export const WRITE_VERSE_BLOCK_SEP = '\n\n⟦ph-block⟧\n\n'
const COL_META_RE = /^⟦ph-col:(\d+)⟧\n?/
/** Legacy refrain header — stripped on load; new cards are always stanzas. */
const LEGACY_REFRAIN_RE = /^\[?refren\]?:?$/i

export type WriteVerseBlockData = {
  text: string
  /** 0-based editor column (empty columns stay empty when cards move). */
  column: number
}

export function parseWriteVerseBlockText(raw: string): WriteVerseBlockData {
  let column = 0
  let body = raw.replace(/^\uFEFF/, '')
  const colMatch = body.match(COL_META_RE)
  if (colMatch) {
    column = Math.max(0, Number(colMatch[1]) || 0)
    body = body.slice(colMatch[0].length)
  }
  const lines = body.split('\n')
  if (lines.length > 0 && LEGACY_REFRAIN_RE.test(lines[0]!.trim())) {
    body = lines.slice(1).join('\n')
  }
  return { text: body, column }
}

/**
 * Split stored lyrics into editor cards.
 * Only splits on the explicit `⟦ph-block⟧` marker — never on blank lines alone.
 */
export function splitWriteVerseBlocks(raw: string): WriteVerseBlockData[] {
  if (!raw) return [{ text: '', column: 0 }]
  if (raw.includes('⟦ph-block⟧')) {
    return raw
      .split(/\n*⟦ph-block⟧\n*/)
      .map((part) => parseWriteVerseBlockText(part))
  }
  // Legacy / single-card content: keep blank lines inside one textarea.
  return [parseWriteVerseBlockText(raw)]
}

export function joinWriteVerseBlocks(list: WriteVerseBlockData[]): string {
  return list
    .map((b) => {
      const col = Math.max(0, Math.floor(b.column || 0))
      const body = b.text.replace(/\s+$/g, '')
      return `⟦ph-col:${col}⟧\n${body}`
    })
    .join(WRITE_VERSE_BLOCK_SEP)
}

/** Strip editor-only markers so published poems show normal stanza gaps. */
export function toPublishablePoemContent(raw: string): string {
  const stripped = raw
    .replace(/⟦ph-col:\d+⟧\n?/g, '')
    .replace(/\n*⟦ph-block⟧\n*/g, '\n\n')
  return stripped
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+$/g, ''))
    .filter((part) => part.length > 0)
    .join('\n\n')
}
