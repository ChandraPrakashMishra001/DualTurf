'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import styles from './page.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart()
  const { currentUser, userProfile } = useAuth()

  // Payment method selection: 'partial_cod' | 'full_online'
  const [paymentMethod, setPaymentMethod] = useState('partial_cod')

  // Shipping Fee configuration
  const shippingFee = cart.length > 0 ? 80 : 0
  const totalAmount = subtotal + shippingFee

  // Partial COD Calculations (₹199 Advance standard, or ₹399 if jersey customization is added)
  const hasCustomizationInCart = cart.some((it) => Boolean(it.customName || it.customNumber))
  const advanceAmount = hasCustomizationInCart ? 399 : 199
  const remainingCODAmount = Math.max(0, totalAmount - advanceAmount)

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

  // Auto-fill address from saved profile (Flipkart style)
  React.useEffect(() => {
    const saved = userProfile?.savedAddress || currentUser?.savedAddress
    if (saved) {
      setFormData({
        fullName: saved.fullName || currentUser?.name || '',
        phone: saved.phone || '',
        email: currentUser?.email || '',
        address: saved.address || '',
        city: saved.city || '',
        state: saved.state || '',
        pincode: saved.pincode || '',
      })
      setAutoFilled(true)
    } else if (currentUser) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        email: prev.email || currentUser.email || '',
      }))
    }
  }, [currentUser, userProfile])

  // Created Order State
  const [orderId, setOrderId] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    setStep('payment')
  }

  const handleInitiatePaymentGateway = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setGatewayNotice(null)

    const isPartial = paymentMethod === 'partial_cod'
    const generatedId = `DT-${Math.floor(100000 + Math.random() * 900000)}`
    const orderPayload = {
      orderId: generatedId,
      customer: formData,
      items: cart,
      subtotal,
      shippingFee,
      totalAmount,
      advanceAmount: isPartial ? advanceAmount : totalAmount,
      balanceCOD: isPartial ? remainingCODAmount : 0,
      paymentMethod: isPartial
        ? `Partial COD (₹${advanceAmount} Advance Online + ₹${remainingCODAmount} Balance on Delivery)`
        : `Full Online Payment (₹${totalAmount})`,
      status: isPartial ? 'Partial COD - Advance Verification' : 'Online Paid - Awaiting Dispatch',
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
      setStep('confirmed')
      setSubmitting(false)
      clearCart()

      // Automatically open WhatsApp message to seller (+91-7656072801)
      const text = `⚽ *NEW DUALTURF ORDER #${generatedId}*

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
${isPartial ? `• 🟢 Advance Online Payment: ₹${advanceAmount} ${hasCustomizationInCart ? '(₹199 Booking + ₹200 Custom Print)' : '(₹199 Booking Advance)'}\n• 💵 Balance to Collect on Delivery (COD): ₹${remainingCODAmount}` : `• 🟢 Total Paid Online: ₹${totalAmount}`}`

      const waUrl = `https://wa.me/917656072801?text=${encodeURIComponent(text)}`
      setTimeout(() => {
        window.open(waUrl, '_blank')
      }, 500)
    }
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

                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1.25rem' }}
                  onClick={() => setStep('address')}
                >
                  PROCEED TO SHIPPING →
                </button>
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
        </div>
      )}

      {/* STEP 3: PAYMENT METHOD */}
      {step === 'payment' && (
        <div className={styles.upiContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            PAYMENT METHOD
          </h1>

          {/* Payment Method Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', maxWidth: '650px', margin: '0 auto 2rem auto' }}>
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
                <span style={{ fontSize: '0.7rem', backgroundColor: '#c4ff3d', color: '#000', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>RECOMMENDED</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#aaaaaa', margin: 0, lineHeight: '1.4' }}>
                Pay <strong>₹{advanceAmount} advance online</strong> now, and remaining <strong>₹{remainingCODAmount}</strong> on delivery.
              </p>
            </button>

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
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: paymentMethod === 'full_online' ? '#c4ff3d' : '#ffffff', fontWeight: 800 }}>🔒 Full Online Payment</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#aaaaaa', margin: 0, lineHeight: '1.4' }}>
                Pay 100% <strong>₹{totalAmount}</strong> online via UPI, Cards, or NetBanking.
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
                    {hasCustomizationInCart
                      ? '• Includes ₹199 order booking advance + ₹200 jersey customization fee.'
                      : '• Includes ₹199 order confirmation & booking advance.'}
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

              <form onSubmit={handleInitiatePaymentGateway} className={styles.utrForm}>
                <div className={styles.formActions}>
                  <button type="button" className="btn-outline" onClick={() => setStep('address')}>
                    ← Edit Address
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting
                      ? 'PROCESSING ORDER...'
                      : paymentMethod === 'partial_cod'
                      ? `PAY ₹${advanceAmount} ADVANCE & CONFIRM →`
                      : `PAY ₹${totalAmount} ONLINE & CONFIRM →`}
                  </button>
                </div>
              </form>
            </div>
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
              ✓ Notification Sent to Seller
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'rgba(255,255,255,0.9)', margin: '0.4rem 0' }}>
              Your order details have been recorded and sent to DualTurf management (+91-7656072801).
            </p>
          </div>

          <div className={styles.confirmedDetails}>
            <h3>Payment & Delivery Summary:</h3>
            <p><strong>{placedOrder.customer.fullName}</strong> ({placedOrder.customer.phone})</p>
            <p>{placedOrder.customer.address}, {placedOrder.customer.city}, {placedOrder.customer.state} - {placedOrder.customer.pincode}</p>
            
            <div style={{ marginTop: '1rem', padding: '0.875rem', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <p>• Total Order Value: <strong>₹{placedOrder.totalAmount}</strong></p>
              <p style={{ color: '#c4ff3d' }}>• Advance Online Payment: <strong>₹{placedOrder.advanceAmount}</strong></p>
              {placedOrder.balanceCOD > 0 && (
                <p style={{ color: '#ffffff' }}>• Balance to Pay on Delivery (COD): <strong>₹{placedOrder.balanceCOD}</strong></p>
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
