#!/usr/bin/env node
/**
 * Fails if legacy ink/gold/rose Tailwind classes appear in app UI sources.
 * Carousel export slides use fixed hex arbitrary values instead of legacy scales.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN_DIRS = [
  join(ROOT, 'components'),
  join(ROOT, 'pages'),
  join(ROOT, 'layouts'),
]
const SCAN_FILES = [
  join(ROOT, 'app.vue'),
  join(ROOT, 'error.vue'),
  join(ROOT, 'assets/css/main.css'),
]
const SKIP_SUFFIXES = ['.stories.ts', '.stories.tsx', '.stories.js', '.stories.jsx']
const LEGACY_RE =
  /(?:^|[^\w-])(?:(?:hover|focus|active|group-hover):)?(?:bg|text|border|ring|accent|divide|from|to|via|placeholder)-(?:ink|gold|rose)-/

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.output') continue
      files.push(...await walk(path))
    } else if (
      (entry.name.endsWith('.vue') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))
      && !SKIP_SUFFIXES.some((s) => entry.name.endsWith(s))
    ) {
      files.push(path)
    }
  }
  return files
}

async function collectFiles() {
  const files = [...SCAN_FILES]
  for (const dir of SCAN_DIRS) {
    try {
      const st = await stat(dir)
      if (st.isDirectory()) files.push(...await walk(dir))
    } catch {
      // skip missing dirs
    }
  }
  return [...new Set(files)]
}

const allFiles = await collectFiles()
const files = []
for (const file of allFiles) {
  try {
    await stat(file)
    files.push(file)
  } catch {
    // skip missing optional paths (e.g. error.vue)
  }
}
const violations = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('legacy tokens OK') || line.includes('ink/gold/rose')) continue
    if (LEGACY_RE.test(line)) {
      violations.push({ file: file.replace(`${ROOT}/`, ''), line: i + 1, text: line.trim() })
    }
  }
}

if (violations.length) {
  console.error('Legacy ink/gold/rose token classes found:')
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`)
  }
  process.exit(1)
}

console.log(`check:legacy-tokens OK (${files.length} files scanned)`)
