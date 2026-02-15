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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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
        padding: '12px 16px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1920px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'block',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                color: '#333'
              }}
              className="mobile-only"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
            
            <div>
              <h1 style={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 'bold', 
                margin: 0,
                color: '#333'
              }}>
                نظام إدارة الدوام والرواتب
              </h1>
              <p style={{ 
                fontSize: 'clamp(12px, 2.5vw, 14px)', 
                color: '#666', 
                margin: '4px 0 0 0' 
              }}>
                القرية الصغيرة للتجارة العامة
              </p>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {user && (
              <span style={{ 
                color: '#666',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                display: 'none'
              }} className="tablet-only">
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
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                whiteSpace: 'nowrap'
              }}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav style={{
          background: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }} className="mobile-only">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '8px'
          }}>
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: pathname === item.path ? '#667eea' : '#666',
                  background: pathname === item.path ? '#f0f0ff' : 'transparent',
                  fontWeight: pathname === item.path ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  borderRadius: '6px',
                  marginBottom: '4px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Desktop Navigation */}
      <nav style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }} className="mobile-hidden">
        <div style={{
          maxWidth: '1920px',
          margin: '0 auto',
          display: 'flex',
          gap: '8px',
          padding: '0 24px',
          flexWrap: 'wrap'
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
                transition: 'all 0.2s',
                fontSize: 'clamp(13px, 1.5vw, 14px)'
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
        maxWidth: '1920px',
        margin: '0 auto',
        padding: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px)',
        minHeight: 'calc(100vh - 300px)',
        flex: 1
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#f8f9fa',
        padding: 'clamp(16px, 3vw, 20px) clamp(16px, 4vw, 24px)',
        textAlign: 'center',
        borderTop: '2px solid #ddd',
        color: '#666',
        fontSize: 'clamp(12px, 2vw, 14px)',
        marginTop: 'auto'
      }}>
        <p style={{ margin: '5px 0' }}>
          برمجة وتصميم وإدارة: <strong style={{ color: '#667eea' }}>عبدالله عبدالرحمن عبود</strong>
        </p>
        <p style={{ margin: '5px 0' }}>
          © 2026 القرية الصغيرة للتجارة العامة - جميع الحقوق محفوظة
        </p>
      </footer>

      <style jsx>{`
        @media (max-width: 639px) {
          .mobile-only {
            display: block !important;
          }
          .mobile-hidden {
            display: none !important;
          }
        }
        
        @media (min-width: 640px) {
          .mobile-only {
            display: none !important;
          }
          .mobile-hidden {
            display: block !important;
          }
        }
        
        @media (min-width: 768px) {
          .tablet-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
