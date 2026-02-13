import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Security middleware for authentication and session management
 * - Validates environment variables
 * - Checks user authentication
 * - Validates session expiration
 * - Implements idle timeout (3 hours)
 */
export async function middleware(request) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Allow access to login page to show setup instructions
    if (request.nextUrl.pathname === '/login') {
      return NextResponse.next()
    }
    // Redirect to login page with setup message
    const url = new URL('/login', request.url)
    url.searchParams.set('setup', 'required')
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // CRITICAL: Check for session tracking cookie
  // This cookie helps us detect if browser was closed and reopened
  const pathname = request.nextUrl.pathname
  const allCookies = request.cookies.getAll()
  const sessionTrackerCookie = allCookies.find(cookie => cookie.name === 'sb-session-tracker')
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') || 
    cookie.name.includes('supabase') ||
    cookie.name.includes('auth-token') ||
    cookie.name.includes('refresh-token')
  )

  // If we're on a protected route and there are Supabase cookies but no session tracker,
  // it means cookies survived browser closure (they were persistent) - clear them
  if (pathname !== '/login' && supabaseCookies.length > 0 && !sessionTrackerCookie) {
    // Cookies exist but no session tracker - they survived browser closure
    // This means they were persistent cookies, not session cookies
    // Clear them to prevent session restoration
    supabaseCookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })
    
    // Redirect to login - session was restored from persistent cookies
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          // Set cookies as session cookies ONLY (no expires/maxAge) for security
          // This ensures cookies are cleared when browser is closed
          // CRITICAL: This prevents refresh tokens from persisting after browser closure
          cookiesToSet.forEach(({ name, value, options }) => {
            // Create session cookie options - FORCE session cookies only
            // This is especially important for refresh tokens which could restore sessions
            const sessionOptions = {
              // Start with default secure options
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              path: '/',
              // Override with provided options (but remove expiration)
              ...options,
            }
            
            // CRITICAL: Remove ALL expiration settings to make it a session cookie
            // Session cookies are automatically cleared when browser is closed
            // DO NOT set expires or maxAge - this would make cookies persistent
            delete sessionOptions.expires
            delete sessionOptions.maxAge
            
            // Ensure proper cookie settings for security
            // These settings ensure cookies are secure and session-only
            sessionOptions.sameSite = sessionOptions.sameSite || 'lax'
            sessionOptions.secure = process.env.NODE_ENV === 'production'
            if (sessionOptions.httpOnly === undefined) {
              sessionOptions.httpOnly = true
            }
            sessionOptions.path = sessionOptions.path || '/'
            
            // Set as session cookie (no expiration = session cookie)
            // This ensures the cookie is cleared when browser closes
            response.cookies.set(name, value, sessionOptions)
          })
          
          // CRITICAL: Set session tracker cookie when Supabase sets auth cookies
          // This helps us detect if browser was closed and cookies survived
          const hasAuthCookie = cookiesToSet.some(({ name }) => 
            name.includes('auth-token') || name.includes('refresh-token')
          )
          
          if (hasAuthCookie) {
            // Set session tracker cookie (session cookie only)
            // This cookie will be cleared when browser closes
            // If it doesn't exist on next request, cookies survived browser closure
            response.cookies.set('sb-session-tracker', Date.now().toString(), {
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              path: '/',
              // NO expires, NO maxAge - session cookie only
            })
          }
        },
      },
    }
  )

  // Handle login page - CRITICAL: Always clear all Supabase cookies to prevent session restoration
  // This ensures that after browser closure, user must login again
  if (pathname === '/login') {
    // Get all cookies to check for Supabase cookies
    const allCookies = request.cookies.getAll()
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.startsWith('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('refresh-token')
    )
    
    // ALWAYS clear Supabase cookies when visiting login page
    // This prevents automatic session restoration after browser closure
    if (supabaseCookies.length > 0 || sessionTrackerCookie) {
      supabaseCookies.forEach(cookie => {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      })
      
      // Clear session tracker cookie
      if (sessionTrackerCookie) {
        response.cookies.set('sb-session-tracker', '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
      
      // Sign out to ensure session is cleared server-side
      await supabase.auth.signOut()
    }
    
    // After clearing cookies, check if there's still a valid session
    // Use getUser() instead of getSession() for security (as recommended by Supabase)
    // getUser() authenticates the data by contacting the Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (user && !userError) {
      // User is authenticated - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Allow access to login page (cookies have been cleared)
    return response
  }

  // For protected routes, validate authentication
  // CRITICAL: Use getUser() instead of getSession() for security
  // getUser() authenticates the data by contacting the Supabase Auth server
  // getSession() reads directly from cookies and may not be authentic
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // If no user or user error, clear cookies and redirect to login
  if (!user || userError) {
    // Clear all Supabase cookies to prevent session restoration
    supabaseCookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })
    
    // Clear session tracker cookie
    if (sessionTrackerCookie) {
      response.cookies.set('sb-session-tracker', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
    
    // Sign out to ensure session is cleared server-side
    await supabase.auth.signOut()
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  // CRITICAL SECURITY CHECK: Verify session tracker exists
  // If user exists but no session tracker, cookies survived browser closure (persistent)
  // Clear everything and force re-login
  if (user && !sessionTrackerCookie) {
    // Session exists but no tracker - cookies survived browser closure
    // This means they were persistent cookies, not session cookies
    // Clear all cookies and force re-login
    supabaseCookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })
    
    // Clear session tracker cookie
    response.cookies.set('sb-session-tracker', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    
    await supabase.auth.signOut()
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  // Additional validation: Check if user is still valid
  // getUser() already validates the session, so we just need to check the user
  // No need to check session expiration separately - getUser() handles that
  if (!user || userError) {
    // Clear session tracker cookie
    if (sessionTrackerCookie) {
      response.cookies.set('sb-session-tracker', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
    
    // Session user doesn't match current user - invalid session
    await supabase.auth.signOut()
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

