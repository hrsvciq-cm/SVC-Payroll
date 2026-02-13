import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const supabase = await createClient()
  
  // Try getSession first as it's more reliable for fresh logins
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  let user = null
  if (session && session.user) {
    user = session.user
  } else {
    // Fallback to getUser if session is not available
    const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
    if (userData && !userError) {
      user = userData
    }
  }

  if (!user) {
    return null
  }

  // Get user role from database
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, email: true, role: true, name: true }
  })

  // If user exists in Supabase but not in database, create with default role
  if (!dbUser) {
    // Create user with default viewer role
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: 'viewer',
        name: user.email?.split('@')[0] || 'User'
      }
    })
    return newUser
  }

  return dbUser
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(allowedRoles) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}

