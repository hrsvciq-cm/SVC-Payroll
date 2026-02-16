import './globals.css'

export const metadata = {
  title: 'نظام إدارة الدوام والرواتب',
  description: 'نظام إدارة الدوام والرواتب - القرية الصغيرة للتجارة العامة',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}

