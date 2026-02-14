import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Logout endpoint - clears session completely
 * - Signs out from Supabase
 * - Clears all session cookies
 * - Redirects to login page
 */
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase (clears session)
    // Ignore 403 errors (session may not exist)
    try {
      await supabase.auth.signOut()
    } catch (signOutError) {
      // Ignore 403 errors - session may not exist
      // This prevents "prepared statement already exists" and 403 errors
      if (signOutError?.status !== 403 && signOutError?.code !== '42P05') {
        console.error('Sign out error:', signOutError)
      }
    }
    
    // Create redirect response
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = NextResponse.redirect(loginUrl)
    
    // Clear all Supabase-related cookies explicitly
    // This ensures no session cookies remain
    const supabaseCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'sb-session-tracker',
    ]
    
    // Clear cookies by setting them to empty with past expiration
    supabaseCookieNames.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })
    
    return response
  } catch (error) {
    // Even if signOut fails, redirect to login
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    return NextResponse.redirect(loginUrl)
  }
}

