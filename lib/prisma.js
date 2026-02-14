import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Prisma Client configuration optimized for Vercel and serverless
// CRITICAL: Use single instance to prevent "prepared statement already exists" errors
// The error occurs when multiple PrismaClient instances try to create prepared statements
// with the same name. By using a single global instance, we prevent this issue.
// CRITICAL: Handle PgBouncer connection pooling correctly
// PgBouncer in transaction mode does not support prepared statements

// Helper function to get the correct database URL
function getDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'
  
  // For local development: Use DIRECT_URL (port 5432) - supports prepared statements
  // This avoids "prepared statement does not exist" errors
  if (!isProduction && !isVercel && directUrl) {
    return directUrl
  }
  
  // For production/Vercel: Use DATABASE_URL with connection pooling (port 6543)
  // Add connection_limit=1 to prevent prepared statement issues
  if (isProduction || isVercel) {
    // Check if using connection pooling
    if (dbUrl.includes('pooler') || dbUrl.includes('pgbouncer') || dbUrl.includes(':6543')) {
      // Add connection_limit=1 to prevent prepared statement issues
      if (dbUrl.includes('?')) {
        // URL already has query parameters
        if (!dbUrl.includes('connection_limit')) {
          return `${dbUrl}&connection_limit=1`
        }
        return dbUrl
      } else {
        // URL has no query parameters
        return `${dbUrl}?connection_limit=1`
      }
    }
  }
  
  // Fallback: Use DIRECT_URL if available, otherwise DATABASE_URL
  return directUrl || dbUrl
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configure datasource URL based on environment
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    }
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

