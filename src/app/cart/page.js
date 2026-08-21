'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import styles from './page.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart()
  const { currentUser, userProfile } = useAuth()

  // Payment method selection: 'gateway' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('gateway')

  // Shipping Fee configuration
  const shippingFee = cart.length > 0 ? 80 : 0
  const totalAmount = subtotal + shippingFee

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

    // Check if Razorpay / Payment Gateway script or API key is active
    if (paymentMethod === 'gateway') {
      setTimeout(() => {
        setGatewayNotice('⚠️ Online Payment Gateway Integration: Please connect your Razorpay or PhonePe API credentials to process live instant card/UPI payments.')
        setSubmitting(false)
      }, 800)
      return
    }

    // COD Order Flow
    const generatedId = `DT-${Math.floor(100000 + Math.random() * 900000)}`
    const orderPayload = {
      orderId: generatedId,
      customer: formData,
      items: cart,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod: 'Cash on Delivery (COD)',
      status: 'COD Order - Awaiting Dispatch',
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
${cart.map((it) => `- ${it.title} (Size: ${it.size}) x ${it.quantity} = ₹${it.price * it.quantity}`).join('\n')}

💳 *Payment Summary:*
• Payment Mode: Cash on Delivery (COD)
• Subtotal: ₹${subtotal}
• Shipping Fee: ₹${shippingFee}
• Total Amount to Collect: ₹${totalAmount}`

      const waUrl = `https://wa.me/917656072801?text=${encodeURIComponent(text)}`
      setTimeout(() => {
        window.open(waUrl, '_blank')
      }, 500)
    }
  }

  const generateWhatsAppLink = () => {
    if (!placedOrder) return '#'
    const text = `⚽ *NEW DUALTURF ORDER #${placedOrder.orderId}*

👤 *Customer Details:*
• Name: ${placedOrder.customer.fullName}
• Phone: ${placedOrder.customer.phone}
• Email: ${placedOrder.customer.email}

📍 *Shipping Address:*
${placedOrder.customer.address}, ${placedOrder.customer.city}, ${placedOrder.customer.state} - ${placedOrder.customer.pincode}

🛍️ *Items Ordered:*
${placedOrder.items.map((it) => `- ${it.title} (Size: ${it.size}) x ${it.quantity} = ₹${it.price * it.quantity}`).join('\n')}

💳 *Payment Summary:*
• Payment Mode: ${placedOrder.paymentMethod}
• Subtotal: ₹${placedOrder.subtotal}
• Shipping Fee: ₹${placedOrder.shippingFee || 80}
• Total Amount: ₹${placedOrder.totalAmount}`

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
                  <div key={`${item.id}-${item.size}-${idx}`} className={styles.itemRow}>
                    <img src={item.image} alt={item.title} className={styles.itemImg} />
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      <p className={styles.itemSize}>Size: <strong>{item.size}</strong></p>
                      <p className={styles.itemPrice}>₹{item.price}</p>
                    </div>

                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQuantity(item.id, item.size, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.size, 1)}>+</button>
                    </div>

                    <div className={styles.lineTotal}>
                      ₹{item.price * item.quantity}
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.id, item.size)}
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

                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1.5rem' }}
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

      {/* STEP 3: PAYMENT GATEWAY INTERFACE */}
      {step === 'payment' && (
        <div className={styles.upiContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            PAYMENT METHOD
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('gateway')}
              style={{
                backgroundColor: paymentMethod === 'gateway' ? 'var(--accent-color)' : '#111111',
                color: paymentMethod === 'gateway' ? '#000000' : '#ffffff',
                border: paymentMethod === 'gateway' ? '2px solid var(--accent-color)' : '1px solid #333333',
                padding: '1.25rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              🔒 Online Payment Gateway
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>Razorpay / PhonePe / Cards / UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              style={{
                backgroundColor: paymentMethod === 'cod' ? 'var(--accent-color)' : '#111111',
                color: paymentMethod === 'cod' ? '#000000' : '#ffffff',
                border: paymentMethod === 'cod' ? '2px solid var(--accent-color)' : '1px solid #333333',
                padding: '1.25rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              💵 Cash on Delivery
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>Pay Cash Upon Arrival</span>
            </button>
          </div>

          <div className={styles.upiBox} style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
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
                <span>Total Payable Amount:</span>
                <strong style={{ color: 'var(--accent-color)', fontSize: '1.25rem' }}>₹{totalAmount}</strong>
              </div>

              <hr className={styles.divider} />

              {gatewayNotice && (
                <div style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)', border: '1px solid #FFB800', color: '#FFD700', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {gatewayNotice}
                </div>
              )}

              <form onSubmit={handleInitiatePaymentGateway} className={styles.utrForm}>
                <div className={styles.formActions}>
                  <button type="button" className="btn-outline" onClick={() => setStep('address')}>
                    ← Edit Address
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'PROCESSING ORDER...' : paymentMethod === 'gateway' ? `PAY ₹${totalAmount} VIA GATEWAY →` : 'PLACE COD ORDER →'}
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
              Your order notification has been sent automatically to DualTurf store management (+91-7656072801).
            </p>
          </div>

          <div className={styles.confirmedDetails}>
            <h3>Shipping & Order Details:</h3>
            <p><strong>{placedOrder.customer.fullName}</strong> ({placedOrder.customer.phone})</p>
            <p>{placedOrder.customer.address}, {placedOrder.customer.city}, {placedOrder.customer.state} - {placedOrder.customer.pincode}</p>
            <p style={{ marginTop: '0.75rem' }}>
              Payment Method: <strong>{placedOrder.paymentMethod}</strong> • Total Amount: <strong>₹{placedOrder.totalAmount}</strong>
            </p>
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
