'use client'

import React, { useState } from 'react'
import { useCart } from '@/context/CartContext'

export default function QuickAddButton({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 'M', 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <>
      <button
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: added ? '#25D366' : 'var(--accent-color)',
          color: '#000000',
          fontSize: '1.25rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
        }}
        onClick={handleQuickAdd}
        title="Quick add"
      >
        {added ? '✓' : '+'}
      </button>
    </>
  )
}
