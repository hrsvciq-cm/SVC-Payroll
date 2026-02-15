import './globals.css'

export const metadata = {
  title: 'نظام إدارة الدوام والرواتب',
  description: 'نظام إدارة الدوام والرواتب - القرية الصغيرة للتجارة العامة',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>{children}</body>
    </html>
  )
}

