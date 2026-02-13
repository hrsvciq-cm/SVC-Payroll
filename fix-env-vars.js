// Script لإصلاح متغيرات البيئة تلقائياً
const fs = require('fs')
const path = require('path')

const password = 'm@3x?u3x@AR3ei%'
const encodedPassword = encodeURIComponent(password)

console.log('🔧 إصلاح متغيرات البيئة...\n')
console.log('كلمة المرور الأصلية:', password)
console.log('كلمة المرور بعد Encoding:', encodedPassword)
console.log('\n')

const envFiles = ['.env', '.env.local']

envFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ملف ${file} غير موجود - سيتم إنشاؤه`)
  }
  
  let content = ''
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8')
  }
  
  // القيم الصحيحة
  const correctValues = {
    'NEXT_PUBLIC_SUPABASE_URL': 'https://yglxbfjakoezxbrgopur.supabase.co',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY': 'sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y',
    'DATABASE_URL': `postgresql://postgres.yglxbfjakoezxbrgopur:${encodedPassword}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc`,
    'DIRECT_URL': `postgresql://postgres.yglxbfjakoezxbrgopur:${encodedPassword}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`
  }
  
  // تحديث أو إضافة المتغيرات
  let updated = false
  let newContent = content
  
  Object.keys(correctValues).forEach(key => {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    const newLine = `${key}="${correctValues[key]}"`
    
    if (regex.test(newContent)) {
      // تحديث القيمة الموجودة
      newContent = newContent.replace(regex, newLine)
      console.log(`✅ تم تحديث ${key} في ${file}`)
      updated = true
    } else {
      // إضافة متغير جديد
      if (newContent && !newContent.endsWith('\n')) {
        newContent += '\n'
      }
      newContent += `${newLine}\n`
      console.log(`✅ تم إضافة ${key} إلى ${file}`)
      updated = true
    }
  })
  
  if (updated || !fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log(`\n✅ تم حفظ ${file}\n`)
  } else {
    console.log(`ℹ️  ${file} لا يحتاج تحديث\n`)
  }
})

console.log('✅ اكتمل الإصلاح!\n')
console.log('الآن جرب:')
console.log('  npx prisma db push')

