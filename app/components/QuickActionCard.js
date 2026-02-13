'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function QuickActionCard({ href, icon, label }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '16px',
        background: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        color: '#333',
        border: `1px solid ${hovered ? '#667eea' : '#ddd'}`,
        transition: 'all 0.2s',
        textAlign: 'center',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontWeight: '600' }}>{label}</div>
    </Link>
  )
}

