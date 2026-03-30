/**
 * When Node loads nitropack runtime .mjs without Vite (SSR external bug), imports like
 * nitro-internal-virtual specifiers fail — they are Nitro build virtuals, not real exports.
 * Node 16+ resolves "imports" in package.json; we add minimal shims under nitropack itself.
 * Idempotent: safe to run on every npm install.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nitroRoot = join(root, 'node_modules', 'nitropack')
const pkgPath = join(nitroRoot, 'package.json')
const shimDir = join(nitroRoot, 'poetryhub-node-shims')

if (!existsSync(pkgPath)) {
  console.warn('[patch-nitropack-node-imports] nitropack not found; skip')
  process.exit(0)
}

mkdirSync(shimDir, { recursive: true })

const files = {
  'error-handler.mjs': `export { default } from '../dist/runtime/internal/error/dev.mjs'
`,
  'plugins.mjs': `export const plugins = []
`,
  'server-handlers.mjs': `export const handlers = []
`,
  'app-config.mjs': `export const appConfig = {}
`,
  'database.mjs': `export const connectionConfigs = {}
`,
  'server-handlers-meta.mjs': `export const handlersMeta = {}
`,
  'tasks.mjs': `export const scheduledTasks = []
export const tasks = {}
`,
  'storage.mjs': `import { createStorage } from 'unstorage'
import memory from 'unstorage/drivers/memory'
export const storage = createStorage({ driver: memory() })
`,
  'public-assets.mjs': `export function getAsset() {
  return null
}
export function isPublicAssetURL() {
  return false
}
export async function readAsset() {
  return null
}
`,
}

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(shimDir, name), content, 'utf8')
}

const importsMap = Object.fromEntries(
  Object.keys(files).map((name) => {
    const key = name.replace(/\.mjs$/, '')
    return [`#nitro-internal-virtual/${key}`, `./poetryhub-node-shims/${name}`]
  }),
)

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.imports = { ...pkg.imports, ...importsMap }
pkg.poetryhubNitroVirtualImports = '2'

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
console.log('[patch-nitropack-node-imports] nitropack package.json imports patched for Node ESM')
