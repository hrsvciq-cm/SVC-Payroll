import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Prisma Client configuration optimized for Vercel and serverless
// CRITICAL: Use single instance to prevent "prepared statement already exists" errors
// The error occurs when multiple PrismaClient instances try to create prepared statements
// with the same name. By using a single global instance, we prevent this issue.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Do NOT override datasources - let Prisma use DATABASE_URL from environment
    // Overriding datasources can cause connection pooling issues with Supabase
  })

// CRITICAL: Always use the same instance in both development and production
// This prevents multiple PrismaClient instances from being created
// In Next.js, each serverless function can create a new instance, so we cache it globally
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production (Vercel), also cache the instance
  // This ensures we use the same instance across all serverless functions
  globalForPrisma.prisma = prisma
}

