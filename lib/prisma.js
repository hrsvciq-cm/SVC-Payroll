import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Prisma Client configuration optimized for Vercel and serverless
// CRITICAL: Use single instance to prevent "prepared statement already exists" errors
// The error occurs when multiple PrismaClient instances try to create prepared statements
// with the same name. By using a single global instance, we prevent this issue.
// CRITICAL: Handle PgBouncer connection pooling correctly
// PgBouncer in transaction mode does not support prepared statements

// Helper function to get the correct database URL
// CRITICAL: For PgBouncer (transaction mode), we need:
// 1. ?pgbouncer=true - tells Prisma to use PgBouncer mode
// 2. connection_limit=1 - prevents multiple connections that cause prepared statement conflicts
// 3. Prepared statements are automatically disabled when pgbouncer=true is set
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
  // CRITICAL: Must add ?pgbouncer=true&connection_limit=1 to prevent error 42P05
  if (isProduction || isVercel) {
    // Check if using connection pooling (port 6543 or contains pooler/pgbouncer)
    if (dbUrl.includes('pooler') || dbUrl.includes('pgbouncer') || dbUrl.includes(':6543')) {
      let modifiedUrl = dbUrl
      
      // Ensure ?pgbouncer=true is present (required for PgBouncer transaction mode)
      if (!modifiedUrl.includes('pgbouncer=true')) {
        if (modifiedUrl.includes('?')) {
          modifiedUrl = `${modifiedUrl}&pgbouncer=true`
        } else {
          modifiedUrl = `${modifiedUrl}?pgbouncer=true`
        }
      }
      
      // Ensure connection_limit=1 is present (prevents multiple connections)
      if (!modifiedUrl.includes('connection_limit')) {
        modifiedUrl = `${modifiedUrl}&connection_limit=1`
      }
      
      return modifiedUrl
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
// NOTE: In Vercel's serverless environment, each function has its own global scope,
// but connection_limit=1 ensures we don't create multiple connections per function
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

