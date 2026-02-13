// Script بسيط لـ encoding كلمة المرور
// استخدم: node encode-password.js

const password = 'm@3x?u3x@AR3ei%'
const encoded = encodeURIComponent(password)

console.log('كلمة المرور الأصلية:', password)
console.log('كلمة المرور بعد Encoding:', encoded)
console.log('\nاستخدم هذا في DATABASE_URL:')
console.log(`postgresql://postgres.yglxbfjakoezxbrgopur:${encoded}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc`)

