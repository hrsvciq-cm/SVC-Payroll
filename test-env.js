// Script للتحقق من متغيرات البيئة
require('dotenv').config({ path: '.env' })

console.log('=== التحقق من متغيرات البيئة ===\n')

const dbUrl = process.env.DATABASE_URL
const directUrl = process.env.DIRECT_URL

console.log('DATABASE_URL موجود:', !!dbUrl)
if (dbUrl) {
  console.log('DATABASE_URL:', dbUrl.substring(0, 50) + '...')
  // محاولة parsing
  try {
    const url = new URL(dbUrl.replace('postgresql://', 'http://'))
    console.log('Host:', url.hostname)
    console.log('Port:', url.port || '5432')
  } catch (e) {
    console.log('❌ خطأ في parsing URL:', e.message)
  }
}

console.log('\nDIRECT_URL موجود:', !!directUrl)
if (directUrl) {
  console.log('DIRECT_URL:', directUrl.substring(0, 50) + '...')
}

