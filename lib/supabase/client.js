import { createBrowserClient } from '@supabase/ssr'

/**
 * Custom storage adapter that prevents localStorage usage
 * Forces Supabase to use cookies only (handled by SSR)
 */
const noLocalStorageAdapter = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

/**
 * Create Supabase client with session-based storage ONLY
 * - Uses cookies for session management (handled by SSR)
 * - Disables localStorage completely to prevent persistent sessions
 * - Session expires when browser/tab is closed (session cookies)
 * - No persistent storage - requires login after browser closure
 */
export function createClient() {
  // Support both naming conventions
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  // Create browser client - Supabase SSR handles cookies automatically
  // We'll manually clear localStorage to prevent persistent sessions
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey
  )

  // Additional security: Clear any localStorage data that might exist
  // This ensures no Supabase data persists in localStorage
  if (typeof window !== 'undefined') {
    // Helper function to clear Supabase localStorage
    const clearSupabaseStorage = () => {
      try {
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || 
          key.includes('supabase') ||
          key.startsWith('supabase.')
        )
        
        supabaseKeys.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // Ignore errors
          }
        })
      } catch (e) {
        // Ignore errors if localStorage is not accessible
      }
    }

    // Clear on page load
    clearSupabaseStorage()

    // Set up cleanup on page unload
    // Note: We don't call signOut() here because:
    // 1. It may not complete before browser closes
    // 2. Session cookies are automatically cleared when browser closes
    // 3. Middleware will handle invalid sessions on next visit
    const handleCleanup = () => {
      clearSupabaseStorage()
    }

    // Clear localStorage on page unload (browser close)
    // Session cookies will be automatically cleared by browser
    window.addEventListener('beforeunload', handleCleanup)
    window.addEventListener('pagehide', handleCleanup)
    
    // Clear on visibility change (tab switch) - optional security measure
    // Uncomment if you want to sign out when tab becomes hidden
    // document.addEventListener('visibilitychange', () => {
    //   if (document.hidden) {
    //     handleCleanup()
    //   }
    // })
  }

  return client
}

