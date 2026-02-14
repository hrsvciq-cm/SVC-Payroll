import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Security middleware for authentication and session management
 * - Validates environment variables
 * - Checks user authentication using Supabase getUser()
 * - Manages session cookies properly
 * - Allows valid sessions to persist
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

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Preserve Supabase's cookie options but ensure proper settings
            const cookieOptions = {
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              path: '/',
              ...options,
            }
            
            // Ensure secure settings
            cookieOptions.sameSite = cookieOptions.sameSite || 'lax'
            cookieOptions.secure = process.env.NODE_ENV === 'production'
            cookieOptions.httpOnly = cookieOptions.httpOnly !== false
            cookieOptions.path = cookieOptions.path || '/'
            
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Get current user - this validates the session with Supabase Auth server
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // Handle login page
  if (request.nextUrl.pathname === '/login') {
    // If user is authenticated, redirect to dashboard
    if (user && !userError) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // If there's an error (expired session, invalid token, etc.), clear cookies
    if (userError) {
      // Clear Supabase cookies on login page if session is invalid
      const allCookies = request.cookies.getAll()
      const supabaseCookies = allCookies.filter(cookie => 
        cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth-token') ||
        cookie.name.includes('refresh-token')
      )
      
      supabaseCookies.forEach(cookie => {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      })
      
      // Only show expired message if query param is set
      // Don't automatically set it here to avoid showing error on fresh login
    }
    
    // Allow access to login page
    return response
  }

  // For protected routes, validate authentication
  if (!user || userError) {
    // User is not authenticated or session is invalid
    // Clear all Supabase cookies
    const allCookies = request.cookies.getAll()
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.startsWith('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('refresh-token')
    )
    
    supabaseCookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })
    
    // Sign out to ensure session is cleared server-side
    // Ignore errors (session may not exist)
    try {
      await supabase.auth.signOut()
    } catch (signOutError) {
      // Ignore 403 and other errors - session may not exist
      // This prevents unnecessary error logs
    }
    
    // Redirect to login with expired message
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated - allow access to protected route
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
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
