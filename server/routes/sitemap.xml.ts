// GET /sitemap.xml — SEO sitemap for all public routes, poems, and authors
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const base = (config.public.appUrl as string).replace(/\/$/, '')

  const [poems, authors] = await Promise.all([
    prisma.poem.findMany({
      select: { slug: true, publishedAt: true },
      where: { language: 'ro' },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.author.findMany({
      select: { slug: true },
      orderBy: { name: 'asc' },
    }),
  ])

  interface UrlEntry {
    loc: string
    lastmod?: string
    changefreq: string
    priority: string
  }

  const staticRoutes: UrlEntry[] = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/poems', priority: '0.9', changefreq: 'daily' },
    { loc: '/authors', priority: '0.8', changefreq: 'weekly' },
    { loc: '/search', priority: '0.6', changefreq: 'weekly' },
    { loc: '/daily', priority: '0.7', changefreq: 'daily' },
  ]

  const poemUrls: UrlEntry[] = poems.map((p) => ({
    loc: `/poems/${p.slug}`,
    lastmod: p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : undefined,
    priority: '0.7',
    changefreq: 'monthly',
  }))

  const authorUrls: UrlEntry[] = authors.map((a) => ({
    loc: `/authors/${a.slug}`,
    priority: '0.6',
    changefreq: 'monthly',
  }))

  const allUrls = [...staticRoutes, ...poemUrls, ...authorUrls]

  const urlEntries = allUrls
    .map((u) => {
      const lastmodTag = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
      return `  <url>
    <loc>${base}${u.loc}</loc>${lastmodTag}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=UTF-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return xml
})
