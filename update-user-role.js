// Script to update user role
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateUserRole() {
  try {
    // استبدل هذا بالبريد الإلكتروني الخاص بك
    const email = process.argv[2] || 'your-email@example.com'
    const newRole = process.argv[3] || 'admin' // admin, hr, finance, viewer
    
    console.log(`جاري تحديث صلاحية المستخدم: ${email} إلى ${newRole}...`)
    
    const user = await prisma.user.update({
      where: { email },
      data: { role: newRole }
    })
    
    console.log('✅ تم تحديث صلاحية المستخدم بنجاح!')
    console.log('المستخدم:', user)
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('❌ المستخدم غير موجود. تأكد من البريد الإلكتروني.')
    } else {
      console.error('❌ خطأ:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole()

