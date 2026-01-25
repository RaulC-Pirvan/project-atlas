import { PrismaClient } from '@prisma/client/extension';

/**
 * Global cache for PrismaClient in non-production environments.
 *
 * Why this exists:
 * - Next.js (App Router) hot-reloads modules in development
 * - Without a global cache, every reload creates a new PrismaClient
 * - That leads to multiple open DB connections and eventual crashes
 *
 * We attach PrismaClient to globalThis in development only.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton PrismaClient instance.
 *
 * Behavior:
 * - In development:
 *   - Reuse the same PrismaClient across hot reloads
 *   - Prevents exhausting database connections
 * - In production:
 *   - A fresh PrismaClient is created per process
 *   - This is safe because production processes do not hot-reload
 *
 * Logging:
 * - Development: query + warn + error (debug-friendly)
 * - Production: error only (avoid noisy logs)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

/**
 * Persist PrismaClient on the global object in development.
 *
 * IMPORTANT:
 * - This must NOT run in production
 * - In production, global state should not be mutated
 *
 * The check ensures:
 * - Dev: cache PrismaClient across reloads
 * - Prod: PrismaClient lifecycle is process-scoped
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
