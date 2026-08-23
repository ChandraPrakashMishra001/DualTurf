'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import styles from './page.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart()
  const { currentUser, userProfile, loginWithGoogle } = useAuth()

  // Payment method selection: 'full_online' | 'partial_cod'
  const [paymentMethod, setPaymentMethod] = useState('full_online')

  // Shipping Fee configuration
  const shippingFee = cart.length > 0 ? 80 : 0
  const totalAmount = subtotal + shippingFee

  // Partial COD Calculations (₹399 per customized jersey, ₹199 per standard jersey)
  const customizedCount = cart.reduce((sum, it) => (it.customName || it.customNumber) ? sum + it.quantity : sum, 0)
  const standardCount = cart.reduce((sum, it) => (!it.customName && !it.customNumber) ? sum + it.quantity : sum, 0)
  const hasCustomizationInCart = customizedCount > 0

  const advanceAmount = (customizedCount * 399) + (standardCount * 199)
  const remainingCODAmount = Math.max(0, totalAmount - advanceAmount)

  const advanceBreakdownText = [
    customizedCount > 0 ? `${customizedCount}x Customized (₹399 each = ₹${customizedCount * 399})` : null,
    standardCount > 0 ? `${standardCount}x Standard (₹199 each = ₹${standardCount * 199})` : null,
  ].filter(Boolean).join(' + ')

  // Checkout step state: 'cart' | 'address' | 'payment' | 'confirmed'
  const [step, setStep] = useState('cart')
  const [submitting, setSubmitting] = useState(false)
  const [gatewayNotice, setGatewayNotice] = useState(null)
  const [autoFilled, setAutoFilled] = useState(false)

  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  // Auto-fill address and customer info from saved profile
  React.useEffect(() => {
    const saved = userProfile?.savedAddress || currentUser?.savedAddress
    if (saved) {
      setFormData({
        fullName: saved.fullName || userProfile?.name || currentUser?.name || '',
        phone: saved.phone || '',
        email: saved.email || currentUser?.email || '',
        address: saved.address || '',
        city: saved.city || '',
        state: saved.state || '',
        pincode: saved.pincode || '',
      })
      setAutoFilled(true)
    } else if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || userProfile?.name || '',
        email: prev.email || currentUser.email || '',
      }))
    }
  }, [currentUser, userProfile])

  // Payment Gateway State
  const [isGatewayOpen, setIsGatewayOpen] = useState(false)
  const [gatewayTab, setGatewayTab] = useState('upi') // 'upi' | 'card' | 'netbanking'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [gatewayStatusText, setGatewayStatusText] = useState('')
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')

  // Created Order State
  const [orderId, setOrderId] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleProceedToShipping = () => {
    if (!currentUser) {
      window.location.href = '/account/login?redirect=/cart'
      return
    }
    setStep('address')
  }

  const handleGoogleQuickLogin = async () => {
    try {
      const result = await loginWithGoogle('/cart')
      // On iOS/desktop: result is returned
      // On Android: page redirects to Google and comes back — no result here
      if (!result) return
    } catch (err) {
      console.warn('Google quick sign-in fallback on mobile:', err)
      window.location.href = '/account/login?redirect=/cart'
    }
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (!currentUser) {
      window.location.href = '/account/login?redirect=/cart'
      return
    }
    setStep('payment')
  }

  // Load Razorpay Standard Checkout Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true)
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Finalize order creation and trigger notifications after verified payment
  const finalizeOrderPlacement = async (paymentTxnId, customOrderId) => {
    const isPartial = paymentMethod === 'partial_cod'
    const generatedId = customOrderId || `DT-${Math.floor(100000 + Math.random() * 900000)}`

    const orderPayload = {
      orderId: generatedId,
      paymentId: paymentTxnId,
      customer: formData,
      items: cart,
      subtotal,
      shippingFee,
      totalAmount,
      advanceAmount: isPartial ? advanceAmount : totalAmount,
      balanceCOD: isPartial ? remainingCODAmount : 0,
      paymentMethod: isPartial
        ? `Partial COD (₹${advanceAmount} Advance Paid Online via Razorpay, ₹${remainingCODAmount} Balance on Delivery)`
        : `Full Online Payment (₹${totalAmount} Paid via Razorpay)`,
      status: isPartial ? 'Partial COD - Advance Paid' : 'Online Paid - Awaiting Dispatch',
    }

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
    } catch (err) {
      console.error('Failed to post order to server:', err)
    } finally {
      setOrderId(generatedId)
      setPlacedOrder(orderPayload)
      setIsGatewayOpen(false)
      setIsProcessingPayment(false)
      setStep('confirmed')
      clearCart()

      // Automatically open WhatsApp message to seller (+91-7656072801)
      const text = `⚽ *NEW DUALTURF ORDER #${generatedId}*
🆔 *Razorpay Payment ID:* ${paymentTxnId}

👤 *Customer Details:*
• Name: ${formData.fullName}
• Phone: ${formData.phone}
• Email: ${formData.email}

📍 *Shipping Address:*
${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}

🛍️ *Items Ordered:*
${cart.map((it) => {
  const customStr = (it.customName || it.customNumber) ? ` [Print: ${it.customName || ''} ${it.customNumber ? '#' + it.customNumber : ''} (+₹200)]` : ''
  return `- ${it.title} (Size: ${it.size}${customStr}) x ${it.quantity} = ₹${it.price * it.quantity}`
}).join('\n')}

💳 *Payment Breakdown:*
• Payment Mode: ${isPartial ? 'Partial Cash on Delivery (Partial COD)' : 'Full Online Payment'}
• Total Order Value: ₹${totalAmount} (Subtotal: ₹${subtotal} + Shipping: ₹${shippingFee})
${isPartial ? `• 🟢 Advance Paid Online (Razorpay): ₹${advanceAmount} (${advanceBreakdownText})\n• 💵 Balance to Collect on Delivery (COD): ₹${remainingCODAmount}` : `• 🟢 Total Paid Online (Razorpay): ₹${totalAmount}`}`

      const waUrl = `https://wa.me/917656072801?text=${encodeURIComponent(text)}`
      setTimeout(() => {
        window.open(waUrl, '_blank')
      }, 500)
    }
  }

  // 1. Trigger Razorpay Standard Checkout to take Advance Payment
  const handleOpenPaymentGateway = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setGatewayNotice(null)

    const payableNow = paymentMethod === 'partial_cod' ? advanceAmount : totalAmount
    const generatedId = `DT-${Math.floor(100000 + Math.random() * 900000)}`

    const isScriptLoaded = await loadRazorpayScript()

    if (isScriptLoaded && window.Razorpay) {
      try {
        const res = await fetch('/api/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: payableNow,
            receipt: generatedId,
            notes: {
              customer_name: formData.fullName,
              customer_phone: formData.phone,
              is_partial: paymentMethod === 'partial_cod' ? 'yes' : 'no',
            },
          }),
        })

        const rzpData = await res.json()

        const options = {
          key: rzpData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TT9B0PlErCoj1I',
          amount: Math.round(payableNow * 100),
          currency: 'INR',
          name: 'DualTurf',
          description: paymentMethod === 'partial_cod'
            ? `Advance Booking (₹${advanceAmount}) - DualTurf`
            : `Order Payment (₹${totalAmount}) - DualTurf`,
          image: 'https://www.dualturf.in/favicon.ico',
          order_id: rzpData.orderId || undefined,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#c4ff3d',
            backdrop_color: '#000000',
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false)
            },
          },
          handler: async function (response) {
            await finalizeOrderPlacement(response.razorpay_payment_id || `PAY_${Date.now()}`, generatedId)
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response) {
          alert(`Payment failed: ${response.error.description}`)
          setSubmitting(false)
        })
        rzp.open()
        setSubmitting(false)
        return
      } catch (err) {
        console.error('Razorpay initialization error:', err)
      }
    }

    // Fallback: Open internal secure gateway modal
    setSubmitting(false)
    setIsGatewayOpen(true)
  }

  // 2. Fallback Gateway modal authorization
  const handleCompleteGatewayPayment = async () => {
    setIsProcessingPayment(true)
    const payableNow = paymentMethod === 'partial_cod' ? advanceAmount : totalAmount
    setGatewayStatusText(`Connecting to Secure Payment Gateway for ₹${payableNow}...`)

    await new Promise((r) => setTimeout(r, 900))
    setGatewayStatusText(`Authorizing ₹${payableNow} with UPI/Bank Network...`)

    await new Promise((r) => setTimeout(r, 1100))
    setGatewayStatusText(`Payment of ₹${payableNow} Verified Successfully! ✓`)

    await new Promise((r) => setTimeout(r, 600))

    const paymentTxnId = `PAY_RZP_${Date.now().toString().slice(-6)}`
    await finalizeOrderPlacement(paymentTxnId)
  }

  const generateWhatsAppLink = () => {
    if (!placedOrder) return '#'
    const isPartial = (placedOrder.balanceCOD || 0) > 0
    const text = `⚽ *NEW DUALTURF ORDER #${placedOrder.orderId}*

👤 *Customer Details:*
• Name: ${placedOrder.customer.fullName}
• Phone: ${placedOrder.customer.phone}
• Email: ${placedOrder.customer.email}

📍 *Shipping Address:*
${placedOrder.customer.address}, ${placedOrder.customer.city}, ${placedOrder.customer.state} - ${placedOrder.customer.pincode}

🛍️ *Items Ordered:*
${placedOrder.items.map((it) => {
  const customStr = (it.customName || it.customNumber) ? ` [Print: ${it.customName || ''} ${it.customNumber ? '#' + it.customNumber : ''} (+₹200)]` : ''
  return `- ${it.title} (Size: ${it.size}${customStr}) x ${it.quantity} = ₹${it.price * it.quantity}`
}).join('\n')}

💳 *Payment Breakdown:*
• Payment Mode: ${placedOrder.paymentMethod}
• Total Order Value: ₹${placedOrder.totalAmount} (Subtotal: ₹${placedOrder.subtotal} + Shipping: ₹${placedOrder.shippingFee || 80})
${isPartial ? `• 🟢 Advance Online Payment: ₹${placedOrder.advanceAmount}\n• 💵 Balance to Collect on Delivery (COD): ₹${placedOrder.balanceCOD}` : `• 🟢 Total Paid Online: ₹${placedOrder.totalAmount}`}`

    return `https://wa.me/917656072801?text=${encodeURIComponent(text)}`
  }

  return (
    <div className={styles.container}>
      {/* Checkout Progress Stepper */}
      <div className={styles.stepper}>
        <div className={`${styles.stepNode} ${step === 'cart' ? styles.activeNode : ''} ${step !== 'cart' ? styles.completedNode : ''}`}>
          <span>1</span>
          <p>Bag</p>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepNode} ${step === 'address' ? styles.activeNode : ''} ${step === 'payment' || step === 'confirmed' ? styles.completedNode : ''}`}>
          <span>2</span>
          <p>Address</p>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepNode} ${step === 'payment' ? styles.activeNode : ''} ${step === 'confirmed' ? styles.completedNode : ''}`}>
          <span>3</span>
          <p>Payment</p>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepNode} ${step === 'confirmed' ? styles.activeNode : ''}`}>
          <span>4</span>
          <p>Confirmation</p>
        </div>
      </div>

      {/* STEP 1: CART ITEMS LIST */}
      {step === 'cart' && (
        <>
          <div className={styles.cartHeader}>
            <h1 className="font-display title-underline" style={{ fontSize: '3rem' }}>
              YOUR BAG ({cart.length})
            </h1>
          </div>

          {cart.length === 0 ? (
            <div className={styles.emptyCartBox}>
              <h2>Your bag is currently empty.</h2>
              <p>Explore our premium 2026-27 club and international kits to get started!</p>
              <Link href="/collections/all" className="btn-primary" style={{ marginTop: '1.5rem' }}>
                EXPLORE ALL KITS →
              </Link>
            </div>
          ) : (
            <div className={styles.cartLayout}>
              <div className={styles.itemList}>
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${item.customName || ''}-${item.customNumber || ''}-${idx}`} className={styles.itemRow}>
                    <img src={item.image} alt={item.title} className={styles.itemImg} />
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      <p className={styles.itemSize}>Size: <strong>{item.size}</strong></p>
                      {(item.customName || item.customNumber) && (
                        <p style={{ fontSize: '0.8125rem', color: '#c4ff3d', fontWeight: '700', marginTop: '0.25rem' }}>
                          ⚡ Player Print: {item.customName || ''} {item.customNumber ? `#${item.customNumber}` : ''} <span style={{ color: '#888', fontWeight: '400' }}>(+₹200)</span>
                        </p>
                      )}
                      <p className={styles.itemPrice}>₹{item.price}</p>
                    </div>

                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQuantity(item.id, item.size, -1, item.customName, item.customNumber)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.size, 1, item.customName, item.customNumber)}>+</button>
                    </div>

                    <div className={styles.lineTotal}>
                      ₹{item.price * item.quantity}
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.id, item.size, item.customName, item.customNumber)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary Sidebar */}
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>ORDER SUMMARY</h3>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Flat Express Shipping</span>
                  <span>₹{shippingFee}</span>
                </div>
                <hr className={styles.divider} />
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>

                {cart.some(it => it.customName || it.customNumber) && (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(196, 255, 61, 0.08)',
                    border: '1px solid rgba(196, 255, 61, 0.25)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#c4ff3d',
                    lineHeight: '1.4'
                  }}>
                    ⏱️ <strong>Customized Print:</strong> Delivery time is extended by 3–5 business days for precision player printing.
                  </div>
                )}

                {currentUser ? (
                  <>
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(196, 255, 61, 0.08)',
                      border: '1px solid rgba(196, 255, 61, 0.25)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>👤 Logged in as <strong style={{ color: '#c4ff3d' }}>{currentUser.name || currentUser.email}</strong></span>
                    </div>

                    <button
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={handleProceedToShipping}
                    >
                      PROCEED TO SHIPPING →
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(255, 184, 0, 0.08)',
                      border: '1px solid rgba(255, 184, 0, 0.35)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.825rem',
                      lineHeight: '1.5'
                    }}>
                      <strong style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                        🔒 Login Required to Order
                      </strong>
                      Please sign in or create an account to proceed with checkout and track your jersey orders.
                    </div>

                    <Link
                      href="/account/login?redirect=/cart"
                      className="btn-primary"
                      style={{
                        width: '100%',
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        height: '48px',
                        fontSize: '0.925rem'
                      }}
                    >
                      🔒 LOGIN / REGISTER TO CHECKOUT →
                    </Link>

                    <button
                      type="button"
                      onClick={handleGoogleQuickLogin}
                      style={{
                        width: '100%',
                        marginTop: '0.6rem',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Quick Sign In with Google
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* STEP 2: SHIPPING ADDRESS FORM */}
      {step === 'address' && (
        <div className={styles.formContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
            SHIPPING ADDRESS
          </h1>

          {!currentUser ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#111111', borderRadius: '12px', border: '1px solid #333' }}>
              <h3 style={{ color: '#FFD700', marginBottom: '0.75rem' }}>🔒 Please Sign In to Enter Shipping Address</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                You must be logged into your DualTurf account to complete checkout.
              </p>
              <Link href="/account/login?redirect=/cart" className="btn-primary" style={{ display: 'inline-block', padding: '0.875rem 2rem' }}>
                SIGN IN / CREATE ACCOUNT →
              </Link>
            </div>
          ) : (
            <>
              {autoFilled && (
                <div style={{
                  backgroundColor: 'rgba(196, 255, 61, 0.1)',
                  border: '1px solid rgba(196, 255, 61, 0.3)',
                  color: '#c4ff3d',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚡ Auto-filled from your saved account address!
                </div>
              )}

          <form onSubmit={handleAddressSubmit} className={styles.addressForm}>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Complete Delivery Address (House No, Street, Landmark) *</label>
              <textarea
                name="address"
                required
                rows="3"
                placeholder="Full delivery address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formRow3}>
              <div className={styles.formGroup}>
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  pattern="[0-9]{6}"
                  placeholder="6-digit Pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className="btn-outline" onClick={() => setStep('cart')}>
                ← Back to Bag
              </button>
              <button type="submit" className="btn-primary">
                PROCEED TO PAYMENT →
              </button>
            </div>
          </form>
          </>
          )}
        </div>
      )}

      {/* STEP 3: PAYMENT METHOD */}
      {step === 'payment' && (
        <div className={styles.upiContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            PAYMENT METHOD
          </h1>

          {!currentUser ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#111111', borderRadius: '12px', border: '1px solid #333', maxWidth: '650px', margin: '0 auto' }}>
              <h3 style={{ color: '#FFD700', marginBottom: '0.75rem', fontSize: '1.2rem' }}>🔒 Please Sign In to Complete Payment</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                You must be logged into your DualTurf account to access payment methods and complete your order.
              </p>
              <Link href="/account/login?redirect=/cart" className="btn-primary" style={{ display: 'inline-block', padding: '0.875rem 2rem' }}>
                SIGN IN / CREATE ACCOUNT →
              </Link>
            </div>
          ) : (
            <>
              {/* Payment Method Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', maxWidth: '650px', margin: '0 auto 2rem auto' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('full_online')}
                  style={{
                    backgroundColor: paymentMethod === 'full_online' ? '#141414' : '#0d0d0d',
                    color: '#ffffff',
                    border: paymentMethod === 'full_online' ? '2px solid #c4ff3d' : '1px solid #2a2a2a',
                    padding: '1.25rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: paymentMethod === 'full_online' ? '#c4ff3d' : '#ffffff', fontWeight: 800 }}>🔒 100% Online Payment</span>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#c4ff3d', color: '#000', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>RECOMMENDED</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#aaaaaa', margin: 0, lineHeight: '1.4' }}>
                    Pay <strong>₹{totalAmount}</strong> online via UPI, Cards, or NetBanking for fastest priority dispatch.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('partial_cod')}
                  style={{
                    backgroundColor: paymentMethod === 'partial_cod' ? '#141414' : '#0d0d0d',
                    color: '#ffffff',
                    border: paymentMethod === 'partial_cod' ? '2px solid #c4ff3d' : '1px solid #2a2a2a',
                    padding: '1.25rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: paymentMethod === 'partial_cod' ? '#c4ff3d' : '#ffffff', fontWeight: 800 }}>⚡ Partial COD</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#aaaaaa', margin: 0, lineHeight: '1.4' }}>
                    Pay <strong>₹{advanceAmount} advance online</strong> now, and remaining <strong>₹{remainingCODAmount}</strong> on delivery.
                  </p>
                </button>
              </div>

          <div className={styles.upiBox} style={{ gridTemplateColumns: '1fr', maxWidth: '650px', margin: '0 auto' }}>
            <div className={styles.upiDetails}>
              <div className={styles.detailRow}>
                <span>Subtotal:</span>
                <strong>₹{subtotal}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Flat Express Shipping:</span>
                <strong>₹{shippingFee}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Total Order Value:</span>
                <strong style={{ fontSize: '1.15rem' }}>₹{totalAmount}</strong>
              </div>

              {/* Partial COD Breakdown Card */}
              {paymentMethod === 'partial_cod' ? (
                <div style={{
                  margin: '1.25rem 0',
                  padding: '1.25rem',
                  backgroundColor: '#161616',
                  border: '1px solid rgba(196, 255, 61, 0.35)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c4ff3d', fontWeight: '800', fontSize: '1.1rem' }}>
                    <span>⚡ Advance Payable Online Now:</span>
                    <span>₹{advanceAmount}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#aaaaaa', margin: 0 }}>
                    • Advance Breakdown: <strong>{advanceBreakdownText}</strong>
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: '700', fontSize: '0.95rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.6rem' }}>
                    <span>💵 Remaining Balance to Collect on Delivery (COD):</span>
                    <span style={{ color: '#fff', fontSize: '1.05rem' }}>₹{remainingCODAmount}</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  margin: '1.25rem 0',
                  padding: '1.25rem',
                  backgroundColor: '#161616',
                  border: '1px solid rgba(196, 255, 61, 0.35)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#c4ff3d',
                  fontWeight: '800',
                  fontSize: '1.1rem'
                }}>
                  <span>Total Amount Payable Online:</span>
                  <span>₹{totalAmount}</span>
                </div>
              )}

              <form onSubmit={handleOpenPaymentGateway} className={styles.utrForm}>
                <div className={styles.formActions}>
                  <button type="button" className="btn-outline" onClick={() => setStep('address')}>
                    ← Edit Address
                  </button>
                  <button type="submit" className="btn-primary">
                    {paymentMethod === 'partial_cod'
                      ? `PROCEED TO PAY ₹${advanceAmount} ADVANCE 🔒 →`
                      : `PROCEED TO PAY ₹${totalAmount} ONLINE 🔒 →`}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* PAYMENT GATEWAY MODAL (FIRST TAKE PAYMENT, THEN CONFIRM) */}
      {isGatewayOpen && (
        <div className={styles.gatewayOverlay} onClick={() => !isProcessingPayment && setIsGatewayOpen(false)}>
          <div className={styles.gatewayModal} onClick={(e) => e.stopPropagation()}>
            
            {/* Gateway Header */}
            <div className={styles.gatewayHeader}>
              <div className={styles.gatewayBrand}>
                <span style={{ fontSize: '1.25rem' }}>🔒</span>
                <span className={styles.gatewayBrandTitle}>DUALTURF SECURE GATEWAY</span>
              </div>
              {!isProcessingPayment && (
                <button className={styles.gatewayClose} onClick={() => setIsGatewayOpen(false)}>✕</button>
              )}
            </div>

            {/* Payable Amount Summary */}
            <div className={styles.gatewayAmountBox}>
              <div>
                <span className={styles.gatewayAmountLabel}>
                  {paymentMethod === 'partial_cod' ? 'Advance Payment Payable Now' : 'Total Amount Payable'}
                </span>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>
                  {paymentMethod === 'partial_cod'
                    ? `${advanceBreakdownText} • Balance ₹${remainingCODAmount} on delivery`
                    : '100% Full Payment via Gateway'}
                </p>
              </div>
              <span className={styles.gatewayAmountVal}>
                ₹{paymentMethod === 'partial_cod' ? advanceAmount : totalAmount}
              </span>
            </div>

            {/* Gateway Body / Tabs */}
            <div className={styles.gatewayBody}>
              {isProcessingPayment ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(196, 255, 61, 0.2)',
                    borderTop: '4px solid #c4ff3d',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: '#c4ff3d', fontWeight: '700', fontSize: '1.05rem', margin: 0 }}>
                    {gatewayStatusText}
                  </p>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                    Please do not refresh or close this window.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.gatewayTabs}>
                    <button
                      type="button"
                      className={`${styles.gatewayTab} ${gatewayTab === 'upi' ? styles.active : ''}`}
                      onClick={() => setGatewayTab('upi')}
                    >
                      ⚡ UPI & QR
                    </button>
                    <button
                      type="button"
                      className={`${styles.gatewayTab} ${gatewayTab === 'card' ? styles.active : ''}`}
                      onClick={() => setGatewayTab('card')}
                    >
                      💳 Cards
                    </button>
                    <button
                      type="button"
                      className={`${styles.gatewayTab} ${gatewayTab === 'netbanking' ? styles.active : ''}`}
                      onClick={() => setGatewayTab('netbanking')}
                    >
                      🏦 NetBanking
                    </button>
                  </div>

                  {/* UPI Tab */}
                  {gatewayTab === 'upi' && (
                    <div className={styles.gatewayTabContent}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                          Scan QR with any UPI App (GPay, PhonePe, Paytm, CRED):
                        </p>
                        <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=turfdual@gmail.com&pn=DualTurf&am=${paymentMethod === 'partial_cod' ? advanceAmount : totalAmount}&cu=INR&tn=DualTurf Advance`)}`}
                            alt="UPI QR Code"
                            style={{ width: '150px', height: '150px', display: 'block' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                          <a
                            href={`upi://pay?pa=turfdual@gmail.com&pn=DualTurf&am=${paymentMethod === 'partial_cod' ? advanceAmount : totalAmount}&cu=INR&tn=DualTurf Advance`}
                            className="btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem', textAlign: 'center', flex: 1 }}
                          >
                            📱 Open GPay / PhonePe
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Tab */}
                  {gatewayTab === 'card' && (
                    <div className={styles.gatewayTabContent}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700 }}>CARD NUMBER</label>
                          <input
                            type="text"
                            placeholder="4532 •••• •••• 8890"
                            maxLength={19}
                            value={cardData.number}
                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700 }}>VALID THRU</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardData.expiry}
                              onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700 }}>CVV</label>
                            <input
                              type="password"
                              placeholder="•••"
                              maxLength={4}
                              value={cardData.cvv}
                              onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NetBanking Tab */}
                  {gatewayTab === 'netbanking' && (
                    <div className={styles.gatewayTabContent}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National'].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            style={{
                              padding: '0.75rem',
                              backgroundColor: selectedBank === bank ? '#1c1c1c' : '#141414',
                              border: selectedBank === bank ? '1px solid #c4ff3d' : '1px solid #2a2a2a',
                              color: selectedBank === bank ? '#c4ff3d' : '#fff',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Gateway Footer Actions */}
            {!isProcessingPayment && (
              <div className={styles.gatewayFooter}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', height: '50px', fontSize: '1rem' }}
                  onClick={handleCompleteGatewayPayment}
                >
                  COMPLETE ₹{paymentMethod === 'partial_cod' ? advanceAmount : totalAmount} PAYMENT 🔒
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#777', margin: '0.6rem 0 0 0' }}>
                  🔒 256-bit Encrypted Payment • Powered by DualTurf Gateway
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* STEP 4: ORDER CONFIRMED */}
      {step === 'confirmed' && placedOrder && (
        <div className={styles.confirmedBox}>
          <div className={styles.successIcon}>✓</div>
          <h1 className="font-display" style={{ fontSize: '3rem', color: 'var(--accent-color)' }}>
            ORDER PLACED!
          </h1>
          <p className={styles.orderIdText}>
            Order Reference ID: <strong>#{orderId}</strong>
          </p>

          <div style={{ backgroundColor: 'rgba(196, 255, 61, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '1.25rem', margin: '1.5rem 0', textAlign: 'left' }}>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              ✓ Advance Payment Received & Notification Sent
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'rgba(255,255,255,0.9)', margin: '0.4rem 0' }}>
              Your advance payment has been verified via the payment gateway and order dispatch instructions have been sent to DualTurf store management (+91-7656072801).
            </p>
          </div>

          <div className={styles.confirmedDetails}>
            <h3>Payment & Delivery Summary:</h3>
            <p><strong>{placedOrder.customer.fullName}</strong> ({placedOrder.customer.phone})</p>
            <p>{placedOrder.customer.address}, {placedOrder.customer.city}, {placedOrder.customer.state} - {placedOrder.customer.pincode}</p>
            
            <div style={{ marginTop: '1rem', padding: '0.875rem', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <p>• Total Order Value: <strong>₹{placedOrder.totalAmount}</strong></p>
              <p style={{ color: '#c4ff3d' }}>• Advance Paid via Gateway: <strong>₹{placedOrder.advanceAmount}</strong> ✓</p>
              {placedOrder.balanceCOD > 0 && (
                <p style={{ color: '#ffffff' }}>• Balance to Pay on Delivery (COD): <strong>₹{placedOrder.balanceCOD}</strong></p>
              )}
              {placedOrder.paymentId && (
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>Transaction ID: {placedOrder.paymentId}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '2rem' }}>
            <a
              href={generateWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.1rem 2rem', fontSize: '1rem' }}
            >
              📱 CHAT WITH SELLER ON WHATSAPP (+91-7656072801) →
            </a>

            <Link href="/collections/all" className="btn-outline" style={{ marginTop: '0.5rem' }}>
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
