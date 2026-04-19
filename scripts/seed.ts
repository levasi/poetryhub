#!/usr/bin/env tsx
/**
 * Database seed script — creates the initial admin user and sample tags.
 * Run once after `prisma db push`:  npm run db:seed
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SITE_OWNER_EMAIL } from '../utils/roles'
import { estimateReadingTime, extractExcerpt } from '../server/utils/slug'

const prisma = new PrismaClient()

// ── Default tags ──────────────────────────────────────────────────────────────

const DEFAULT_TAGS = [
  // Moods
  { name: 'Love',        slug: 'love',        category: 'mood',  color: '#f43f5e' },
  { name: 'Melancholy',  slug: 'melancholy',  category: 'mood',  color: '#8b5cf6' },
  { name: 'Joy',         slug: 'joy',         category: 'mood',  color: '#f8c44a' },
  { name: 'Dark',        slug: 'dark',        category: 'mood',  color: '#374151' },
  { name: 'Philosophical', slug: 'philosophical', category: 'mood', color: '#6b7280' },
  { name: 'Funny',       slug: 'funny',       category: 'mood',  color: '#10b981' },
  { name: 'Romantic',    slug: 'romantic',    category: 'mood',  color: '#ec4899' },
  { name: 'Nostalgic',   slug: 'nostalgic',   category: 'mood',  color: '#a78bfa' },
  // Themes
  { name: 'Nature',      slug: 'nature',      category: 'theme', color: '#22c55e' },
  { name: 'Death',       slug: 'death',       category: 'theme', color: '#4b5563' },
  { name: 'War',         slug: 'war',         category: 'theme', color: '#b45309' },
  { name: 'Identity',    slug: 'identity',    category: 'theme', color: '#3b82f6' },
  { name: 'Spirituality', slug: 'spirituality', category: 'theme', color: '#d97706' },
  { name: 'Time',        slug: 'time',        category: 'theme', color: '#94a3b8' },
  { name: 'Freedom',     slug: 'freedom',     category: 'theme', color: '#0ea5e9' },
  // Styles
  { name: 'Sonnet',      slug: 'sonnet',      category: 'style' },
  { name: 'Haiku',       slug: 'haiku',       category: 'style' },
  { name: 'Free Verse',  slug: 'free-verse',  category: 'style' },
  { name: 'Ballad',      slug: 'ballad',      category: 'style' },
  { name: 'Ode',         slug: 'ode',         category: 'style' },
  // Eras
  { name: 'Romantic Era',   slug: 'romantic-era',   category: 'era' },
  { name: 'Victorian',      slug: 'victorian',       category: 'era' },
  { name: 'Modern',         slug: 'modern',          category: 'era' },
  { name: 'Contemporary',   slug: 'contemporary',    category: 'era' },
  { name: 'Ancient',        slug: 'ancient',         category: 'era' },
]

async function main() {
  console.log('🌱 Seeding database…\n')

  // ── Admin user ──────────────────────────────────────────────────────────────
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@poetryhub.com'
  const password = process.env.ADMIN_PASSWORD ?? 'admin123'

  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    console.log(`  ⚠ Admin user already exists: ${email}`)
  } else {
    const hash = await bcrypt.hash(password, 12)
    await prisma.adminUser.create({
      data: { email, passwordHash: hash, name: 'Admin' },
    })
    console.log(`  ✓ Legacy AdminUser created: ${email}`)
    console.log(`    Password: ${password}  ← change this in production!\n`)
  }

  // ── Promote site owner account to admin (see `SITE_OWNER_EMAIL` in utils/roles.ts)
  const appUser = await prisma.user.findUnique({ where: { email: SITE_OWNER_EMAIL } })
  if (appUser) {
    if (appUser.role !== UserRole.admin) {
      await prisma.user.update({
        where: { id: appUser.id },
        data: { role: UserRole.admin },
      })
      console.log(`  ✓ User promoted to admin: ${SITE_OWNER_EMAIL}`)
    } else {
      console.log(`  ⚠ Already admin: ${SITE_OWNER_EMAIL}`)
    }
  } else {
    console.log(
      `  ⚠ No User with ${SITE_OWNER_EMAIL} — register that account, then run: npm run db:seed`,
    )
  }

  // ── Tags ────────────────────────────────────────────────────────────────────
  console.log('  Creating default tags…')
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where:  { slug: tag.slug },
      update: { name: tag.name, category: tag.category, color: tag.color ?? null },
      create: { ...tag, color: tag.color ?? null },
    })
    process.stdout.write(`    · ${tag.name}\n`)
  }

  // ── Placeholder poem (Romanian carousel demo text — same as generator sample) ─
  const PLACEHOLDER_AUTHOR_SLUG = 'poetryhub'
  const PLACEHOLDER_POEM_SLUG = 'titlu-exemplu-carousel'
  const PLACEHOLDER_TITLE = 'Titlu exemplu'
  const PLACEHOLDER_BODY =
    'Primul vers al poeziei stă aici,\n\nAl doilea îl completează firesc.\n\nPoți scrie încă un strof, dacă vrei,\n\nCu liniște, lumină sau priviri noi.'

  const placeholderAuthor = await prisma.author.upsert({
    where: { slug: PLACEHOLDER_AUTHOR_SLUG },
    update: { name: 'PoetryHub' },
    create: { name: 'PoetryHub', slug: PLACEHOLDER_AUTHOR_SLUG },
  })

  const snippet = extractExcerpt(PLACEHOLDER_BODY)
  const rt = estimateReadingTime(PLACEHOLDER_BODY)
  await prisma.poem.upsert({
    where: { slug: PLACEHOLDER_POEM_SLUG },
    update: {
      title: PLACEHOLDER_TITLE,
      content: PLACEHOLDER_BODY,
      excerpt: snippet,
      readingTime: rt,
      authorId: placeholderAuthor.id,
      language: 'ro',
      source: 'classic',
      sourceUrl: null,
    },
    create: {
      slug: PLACEHOLDER_POEM_SLUG,
      title: PLACEHOLDER_TITLE,
      content: PLACEHOLDER_BODY,
      excerpt: snippet,
      readingTime: rt,
      authorId: placeholderAuthor.id,
      language: 'ro',
      source: 'classic',
      sourceUrl: null,
    },
  })
  console.log(
    `  ✓ Placeholder poem upserted: ${PLACEHOLDER_TITLE} (/authors/${PLACEHOLDER_AUTHOR_SLUG}?poem=${PLACEHOLDER_POEM_SLUG})\n`,
  )

  console.log(`\n✅ Seed complete. ${DEFAULT_TAGS.length} tags created/updated.\n`)
  console.log('Next step: npm run poems:import  — to pull poems from PoetryDB')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
