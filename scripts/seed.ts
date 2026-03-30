#!/usr/bin/env tsx
/**
 * Database seed script — creates the initial admin user and sample tags.
 * Run once after `prisma db push`:  npm run db:seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
    console.log(`  ✓ Admin user created: ${email}`)
    console.log(`    Password: ${password}  ← change this in production!\n`)
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

  console.log(`\n✅ Seed complete. ${DEFAULT_TAGS.length} tags created/updated.\n`)
  console.log('Next step: npm run poems:import  — to pull poems from PoetryDB')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
