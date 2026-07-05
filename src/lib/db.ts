import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Database client with Turso + local SQLite support.
 *
 * - If TURSO_DATABASE_URL & TURSO_AUTH_TOKEN are set, uses Turso (libSQL).
 * - Otherwise, falls back to local SQLite via DATABASE_URL=file:...
 *
 * This makes the app deployable to Vercel/Netlify with Turso while keeping
 * local dev frictionless.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    // Turso / libSQL mode (production)
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter } as any)
  }

  // Local SQLite mode (development)
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
