export type DocsNavItem = {
  label: string
  to: string
  description?: string
}

export type DocsTabGroup = {
  id: 'start' | 'stack' | 'api' | 'features' | 'dev'
  label: string
  items: DocsNavItem[]
}

export const docsTabGroups: DocsTabGroup[] = [
  {
    id: 'start',
    label: 'Start',
    items: [
      { label: 'Prezentare generală', to: '/docs', description: 'Arhitectură și fluxuri principale' },
    ],
  },
  {
    id: 'stack',
    label: 'Stack',
    items: [
      { label: 'Frontend', to: '/docs/stack/frontend', description: 'Nuxt, Vue, Tailwind, Pinia' },
      { label: 'Backend', to: '/docs/stack/backend', description: 'Nitro, auth, validare' },
      { label: 'Bază de date', to: '/docs/stack/database', description: 'PostgreSQL, Prisma' },
      { label: 'Deployment', to: '/docs/stack/deployment', description: 'Vercel, env, CI' },
    ],
  },
  {
    id: 'api',
    label: 'API',
    items: [
      { label: 'Rute API', to: '/docs/api', description: 'Toate endpoint-urile Nitro' },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    items: [
      { label: 'Citire & descoperire', to: '/docs/features/reading' },
      { label: 'Scrie (Write)', to: '/docs/features/write' },
      { label: 'Carousel Instagram', to: '/docs/features/carousel' },
      { label: 'Cont & autentificare', to: '/docs/features/account' },
      { label: 'Admin', to: '/docs/features/admin' },
    ],
  },
  {
    id: 'dev',
    label: 'Dev',
    items: [
      { label: 'Storybook', to: '/docs/development/storybook' },
      { label: 'Testare', to: '/docs/development/testing' },
      { label: 'Design system', to: '/docs/development/design-system' },
    ],
  },
]

export function docsTabForPath(path: string): DocsTabGroup['id'] {
  if (path.startsWith('/docs/stack')) return 'stack'
  if (path.startsWith('/docs/api')) return 'api'
  if (path.startsWith('/docs/features')) return 'features'
  if (path.startsWith('/docs/development')) return 'dev'
  return 'start'
}

export function docsNavIsActive(path: string, to: string): boolean {
  if (to === '/docs') return path === '/docs' || path === '/docs/'
  return path === to || path.startsWith(`${to}/`)
}
