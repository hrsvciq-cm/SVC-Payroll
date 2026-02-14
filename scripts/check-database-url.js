/**
 * Script to check and validate DATABASE_URL
 * This script helps diagnose connection string parsing issues
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set in environment variables')
  console.log('\n📝 Please check your .env.local or .env file')
  process.exit(1)
}

console.log('🔍 Checking DATABASE_URL...\n')
console.log('Current DATABASE_URL:')
console.log(databaseUrl)
console.log('\n')

// Try to parse the URL
try {
  const url = new URL(databaseUrl)
  
  console.log('✅ URL parsed successfully')
  console.log('\n📊 Parsed Components:')
  console.log(`  Protocol: ${url.protocol}`)
  console.log(`  Username: ${url.username}`)
  console.log(`  Password: ${url.password ? '***' + url.password.slice(-3) : '(empty)'}`)
  console.log(`  Host: ${url.hostname}`)
  console.log(`  Port: ${url.port || '(default)'}`)
  console.log(`  Path: ${url.pathname}`)
  console.log(`  Search: ${url.search}`)
  
  // Check for special characters in password that need encoding
  const password = url.password
  if (password) {
    const needsEncoding = /[@?#%]/.test(password)
    if (needsEncoding) {
      console.log('\n⚠️  WARNING: Password contains special characters that may need URL encoding!')
      console.log('   Special characters found: @, ?, #, or %')
      console.log('\n📝 Encoding guide:')
      console.log('   @ → %40')
      console.log('   ? → %3F')
      console.log('   # → %23')
      console.log('   % → %25')
      console.log('   & → %26')
      console.log('   = → %3D')
      
      // Show encoded version
      const encodedPassword = encodeURIComponent(password)
      console.log(`\n   Original password: ${password}`)
      console.log(`   Encoded password: ${encodedPassword}`)
      
      // Reconstruct URL with encoded password
      const encodedUrl = databaseUrl.replace(
        `:${password}@`,
        `:${encodedPassword}@`
      )
      console.log(`\n   Encoded DATABASE_URL:`)
      console.log(`   ${encodedUrl}`)
    }
  }
  
  // Check connection string format
  if (url.protocol !== 'postgresql:') {
    console.log('\n⚠️  WARNING: Protocol is not postgresql://')
  }
  
  if (!url.hostname.includes('supabase')) {
    console.log('\n⚠️  WARNING: Hostname does not contain "supabase"')
  }
  
  // Check for connection pooler
  if (url.search.includes('pgbc') || url.search.includes('pgbouncer')) {
    console.log('\n✅ Connection pooler detected in URL')
  } else {
    console.log('\n⚠️  WARNING: No connection pooler parameter found')
    console.log('   Consider adding ?pgbc or ?pgbouncer=true for connection pooling')
  }
  
} catch (error) {
  console.error('❌ Failed to parse DATABASE_URL as URL')
  console.error('   Error:', error.message)
  console.log('\n💡 Common issues:')
  console.log('   1. Missing protocol (should start with postgresql://)')
  console.log('   2. Special characters in password not URL-encoded')
  console.log('   3. Missing @ between credentials and host')
  console.log('   4. Invalid hostname or port')
}

console.log('\n' + '='.repeat(60))
console.log('\n📋 Next Steps:')
console.log('   1. If password needs encoding, update your .env.local file')
console.log('   2. Make sure DATABASE_URL uses the correct format:')
console.log('      postgresql://user:password@host:port/database?options')
console.log('   3. For Supabase, use connection pooler: ?pgbc or ?pgbouncer=true')
console.log('   4. Restart your development server after updating .env.local')

