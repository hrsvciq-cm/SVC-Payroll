import './globals.css'

export const metadata = {
  title: 'نظام إدارة الدوام والرواتب',
  description: 'نظام إدارة الدوام والرواتب - القرية الصغيرة للتجارة العامة',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}

