'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Login Form Component - wrapped in Suspense for useSearchParams
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupRequired, setSetupRequired] = useState(false)

  useEffect(() => {
    // Clear localStorage only (middleware handles signOut server-side)
    // This prevents duplicate signOut calls that cause 403 errors
    if (typeof window !== 'undefined') {
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
    }
    
    if (searchParams.get('setup') === 'required') {
      setSetupRequired(true)
      setError('يرجى إعداد متغيرات البيئة في ملف .env.local')
    }
    if (searchParams.get('expired') === 'true') {
      setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        setLoading(false)
        return
      }

      if (data.user && data.session) {
        // Clear any error messages
        setError('')
        
        // Clear localStorage to ensure session is only in cookies
        if (typeof window !== 'undefined') {
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
        }
        
        // Supabase SSR automatically saves session in cookies
        // Use window.location.replace for full page reload
        // This ensures middleware validates the session properly
        window.location.replace('/dashboard')
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.')
        setLoading(false)
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px'
          }}>
            نظام إدارة الدوام والرواتب
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666'
          }}>
            القرية الصغيرة للتجارة العامة
          </p>
        </div>

        {setupRequired && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            fontSize: '14px'
          }}>
            <strong>⚠️ إعداد مطلوب:</strong>
            <p style={{ marginTop: '8px', marginBottom: '0' }}>
              يرجى إعداد ملف <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code> مع متغيرات Supabase.
              <br />
              راجع ملف <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>SETUP.md</code> للتعليمات.
            </p>
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          autoComplete="on"
          method="post"
          action="#"
        >
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              placeholder="أدخل البريد الإلكتروني"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              id="password"
              autoComplete={rememberMe ? 'current-password' : 'off'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              placeholder="أدخل كلمة المرور"
            />
          </div>

          <div style={{ 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              style={{
                width: '18px',
                height: '18px',
                cursor: loading ? 'not-allowed' : 'pointer',
                accentColor: '#667eea'
              }}
            />
            <label 
              htmlFor="rememberMe"
              style={{
                fontSize: '14px',
                color: '#666',
                cursor: loading ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>تذكرني</span>
              <span style={{ fontSize: '12px', color: '#999' }}>
                (السماح للمتصفح بحفظ بيانات تسجيل الدخول)
              </span>
            </label>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: loading ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.opacity = '0.9'
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.opacity = '1'
            }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Main Login Page Component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          color: 'white',
          fontSize: '18px'
        }}>
          جاري التحميل...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

