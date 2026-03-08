/**
 * Shown while a route segment is loading (Next.js loading.js).
 * Keeps layout stable and gives instant feedback during client-side navigation.
 */
export default function PageLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 300px)',
        padding: '40px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '1920px',
        margin: '0 auto'
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="page-loading-spinner" />
      <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
        جاري التحميل...
      </p>
    </div>
  )
}
