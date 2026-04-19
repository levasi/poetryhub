// Singleton Prisma client — prevents connection exhaustion in serverless (Vercel)
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & { __prisma?: PrismaClient }

/** Ensure root `.env` / `.env.local` are applied before Prisma reads `DATABASE_URL` (ordering edge cases in dev). */
function loadRootDotenv() {
  const root = process.cwd()
  loadEnv({ path: resolve(root, '.env') })
  loadEnv({ path: resolve(root, '.env.local'), override: true })
}

/** Prisma schema uses `env("DATABASE_URL")`. Ensure it exists (Vercel Postgres often exposes `POSTGRES_URL`). */
function ensureDatabaseUrlEnv() {
  if (process.env.DATABASE_URL?.trim()) return
  const alt =
    process.env.POSTGRES_URL?.trim()
    || process.env.POSTGRES_PRISMA_URL?.trim()
    || process.env.VERCEL_POSTGRES_URL?.trim()
  if (alt) process.env.DATABASE_URL = alt
}

function createPrismaClient() {
  loadRootDotenv()
  ensureDatabaseUrlEnv()
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'DATABASE_URL is not set. Copy `.env.example` to `.env` in the project root and set DATABASE_URL to your PostgreSQL URL (Neon, Supabase, or local Postgres). See README.',
    )
  }
  /** Query logging floods the terminal and can slow or destabilize `nuxt dev`; opt in with PRISMA_LOG_QUERIES=1 */
  const devLogs =
    process.env.PRISMA_LOG_QUERIES === '1' || process.env.PRISMA_LOG_QUERIES === 'true'
      ? (['query', 'error', 'warn'] as const)
      : (['error', 'warn'] as const)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [...devLogs] : ['error'],
  })
}

// Reuse one client per runtime (dev HMR + warm serverless invocations).
export const prisma: PrismaClient = globalForPrisma.__prisma ?? createPrismaClient()
globalForPrisma.__prisma = prisma
