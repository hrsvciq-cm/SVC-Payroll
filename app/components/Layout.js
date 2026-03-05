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
    // Don't check session on login page
    if (pathname === '/login') {
      return
    }

    // Non-blocking: Show page immediately, check auth in background
    // غير محظور: عرض الصفحة فوراً، التحقق من المصادقة في الخلفية

    async function getUser() {
      try {
        const supabase = createClient()
        
        // Add timeout to prevent hanging
        // إضافة timeout لمنع التعليق
        const authPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )
        
        let sessionResult
        try {
          sessionResult = await Promise.race([authPromise, timeoutPromise])
        } catch (error) {
          // Timeout or error - silently fail, middleware will handle auth
          // انتهت المهلة أو خطأ - فشل صامت، middleware سيتعامل مع المصادقة
          return
        }
        
        const { data: { session }, error: sessionError } = sessionResult || { data: { session: null }, error: { message: 'No result' } }
        
        if (sessionError || !session || !session.user) {
          // Silently fail - middleware will handle auth
          // الفشل الصامت - middleware سيتعامل مع المصادقة
          return
        }

        setUser(session.user)

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
          try {
            // Check idle timeout first (no network call needed)
            // التحقق من انتهاء المهلة أولاً (لا حاجة لطلب الشبكة)
            const idleTime = Date.now() - lastActivityRef.current
            if (idleTime >= IDLE_TIMEOUT) {
              await handleSessionExpired()
              return
            }

            // Check if session is still valid (with timeout)
            // التحقق من أن الجلسة لا تزال صالحة (مع timeout)
            const supabase = createClient()
            const sessionPromise = supabase.auth.getSession()
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            )
            
            let sessionResult
            try {
              sessionResult = await Promise.race([sessionPromise, timeoutPromise])
            } catch (error) {
              // Timeout or error - silently skip this check
              // انتهت المهلة أو خطأ - تخطي هذا الفحص بصمت
              return
            }
            
            const { data: { session: currentSession } } = sessionResult || { data: { session: null } }
            
            if (!currentSession) {
              await handleSessionExpired()
              return
            }
          } catch (error) {
            // Silently handle errors in interval check
            // معالجة الأخطاء بصمت في فحص الفترة
            console.warn('Session check error:', error)
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
      } catch (error) {
        // Silently handle auth errors - don't block page load
        // معالجة أخطاء المصادقة بصمت - لا تمنع تحميل الصفحة
        console.warn('Auth check failed:', error)
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

  // Don't block page rendering - show content immediately
  // لا تمنع عرض الصفحة - عرض المحتوى فوراً
  // Auth check happens in background and won't block UI
  // فحص المصادقة يحدث في الخلفية ولن يمنع واجهة المستخدم

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
