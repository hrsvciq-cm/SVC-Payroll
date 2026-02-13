'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Security constants
const IDLE_TIMEOUT = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
const CHECK_INTERVAL = 60000 // Check every minute
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown']

export default function Layout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const lastActivityRef = useRef(Date.now())
  const timeoutIdRef = useRef(null)
  const checkIntervalRef = useRef(null)

  // Define callbacks before useEffect to avoid reference errors
  const handleSessionExpired = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login?expired=true')
    router.refresh()
  }, [router])

  const resetIdleTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }

    timeoutIdRef.current = setTimeout(() => {
      handleSessionExpired()
    }, IDLE_TIMEOUT)
  }, [handleSessionExpired])

  useEffect(() => {
    async function getUser() {
      // Don't check session on login page
      if (pathname === '/login') {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Use getSession first as it's more reliable for fresh logins
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session || !session.user) {
          // Try getUser as fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError || !user) {
            router.push('/login?expired=true')
            return
          }
          setUser(user)
        } else {
          setUser(session.user)
        }

        setLoading(false)
      } catch (error) {
        // Silently handle auth errors - redirect to login
        setLoading(false)
        router.push('/login?expired=true')
      }

      // Initialize idle timeout
      lastActivityRef.current = Date.now()
      resetIdleTimeout()

      // Setup activity listeners to reset idle timeout
      const handleActivity = () => {
        lastActivityRef.current = Date.now()
        resetIdleTimeout()
      }

      const listeners = []
      ACTIVITY_EVENTS.forEach(activity => {
        window.addEventListener(activity, handleActivity, { passive: true })
        listeners.push({ activity, handler: handleActivity })
      })

      // Check session and idle timeout periodically
      checkIntervalRef.current = setInterval(async () => {
        // Check if session is still valid
        const supabase = createClient()
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!currentSession) {
          await handleSessionExpired()
          return
        }

        // Check idle timeout
        const idleTime = Date.now() - lastActivityRef.current
        if (idleTime >= IDLE_TIMEOUT) {
          await handleSessionExpired()
        }
      }, CHECK_INTERVAL)

      // Note: We don't manually sign out on page navigation
      // Session cookies are automatically cleared when browser is closed
      // Manual sign out would interfere with normal page navigation

      // Cleanup function
      return () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current)
        }
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
        }
        listeners.forEach(({ activity, handler }) => {
          window.removeEventListener(activity, handler)
        })
      }
    }

    getUser()
  }, [router, pathname, resetIdleTimeout, handleSessionExpired])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  // Define navItems before conditional return (React Hooks rule)
  const navItems = useMemo(() => [
    { path: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
    { path: '/employees', label: 'الموظفين', icon: '👥' },
    { path: '/attendance', label: 'تسجيل الدوام', icon: '📅' },
    { path: '/payroll', label: 'الرواتب', icon: '💰' },
    { path: '/reports', label: 'التقارير', icon: '📈' },
  ], [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '16px 24px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              margin: 0,
              color: '#333'
            }}>
              نظام إدارة الدوام والرواتب
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              margin: '4px 0 0 0' 
            }}>
              القرية الصغيرة للتجارة العامة
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <span style={{ color: '#666' }}>
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '8px',
          padding: '0 24px'
        }}>
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              style={{
                padding: '12px 20px',
                textDecoration: 'none',
                color: pathname === item.path ? '#667eea' : '#666',
                borderBottom: pathname === item.path ? '3px solid #667eea' : '3px solid transparent',
                fontWeight: pathname === item.path ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 24px 24px',
        minHeight: 'calc(100vh - 300px)'
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#f8f9fa',
        padding: '20px 24px',
        textAlign: 'center',
        borderTop: '2px solid #ddd',
        color: '#666',
        fontSize: '14px',
        marginTop: 'auto'
      }}>
        <p style={{ margin: '5px 0' }}>
          برمجة وتصميم وإدارة: <strong style={{ color: '#667eea' }}>عبدالله عبدالرحمن عبود</strong>
        </p>
        <p style={{ margin: '5px 0' }}>
          © 2026 القرية الصغيرة للتجارة العامة - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}

