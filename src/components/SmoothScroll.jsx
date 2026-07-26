'use client'

import React from 'react'

// Removed Lenis — native scroll is always faster and jank-free.
// CSS scroll-behavior + Intersection Observer handles everything smoothly.
export default function SmoothScroll({ children }) {
  return <>{children}</>
}
