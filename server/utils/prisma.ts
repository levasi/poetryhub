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
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Reuse one client per runtime (dev HMR + warm serverless invocations).
export const prisma: PrismaClient = globalForPrisma.__prisma ?? createPrismaClient()
globalForPrisma.__prisma = prisma
