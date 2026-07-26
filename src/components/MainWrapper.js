'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function MainWrapper({ children }) {
  const pathname = usePathname()
  const [paddingTop, setPaddingTop] = useState('0px')

  useEffect(() => {
    // If homepage, no top padding so hero image extends behind header
    // If inner page, 110px top padding so header never overlaps content
    if (pathname === '/' || pathname === '/coming-soon') {
      setPaddingTop('0px')
    } else {
      setPaddingTop('110px')
    }
  }, [pathname])

  return (
    <main
      style={{
        paddingTop: paddingTop,
        minHeight: '80vh',
        transition: 'padding-top 0.15s ease',
      }}
    >
      {children}
    </main>
  )
}
