// Singleton Prisma client — prevents connection exhaustion in serverless (Vercel)
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & { __prisma?: PrismaClient }

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
  ensureDatabaseUrlEnv()
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
