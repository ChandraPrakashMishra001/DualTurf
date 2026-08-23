'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dualturf_cart')
      if (saved) {
        setCart(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e)
    }
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dualturf_cart', JSON.stringify(cart))
    } catch (e) {
      console.error('Failed to save cart to localStorage', e)
    }
  }, [cart])

  const addToCart = (product, size = 'M', quantity = 1, customization = {}) => {
    const cName = (customization.customName || '').trim().toUpperCase()
    const cNum = (customization.customNumber || '').trim()
    const hasCustomization = Boolean(cName || cNum)
    const customizationFee = hasCustomization ? 200 : 0
    const finalItemPrice = (Number(product.price) || 0) + customizationFee

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.id === product.id &&
          item.size === size &&
          (item.customName || '') === cName &&
          (item.customNumber || '') === cNum
      )

      if (existingIndex > -1) {
        const updated = [...prevCart]
        updated[existingIndex].quantity += quantity
        return updated
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            slug: product.slug,
            title: product.title || product.name,
            basePrice: Number(product.price) || 0,
            price: finalItemPrice,
            customizationFee: customizationFee,
            image: product.image,
            size: size,
            customName: cName,
            customNumber: cNum,
            quantity: quantity,
          },
        ]
      }
    })

    // Open cart drawer on add
    setIsCartOpen(true)
  }

  const removeFromCart = (id, size, customName = '', customNumber = '') => {
    const cName = (customName || '').trim().toUpperCase()
    const cNum = (customNumber || '').trim()
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === id &&
            item.size === size &&
            (item.customName || '') === cName &&
            (item.customNumber || '') === cNum
          )
      )
    )
  }

  const updateQuantity = (id, size, delta, customName = '', customNumber = '') => {
    const cName = (customName || '').trim().toUpperCase()
    const cNum = (customNumber || '').trim()
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.id === id &&
            item.size === size &&
            (item.customName || '') === cName &&
            (item.customNumber || '') === cNum
          ) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
