'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './page.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart()

  // Payment method selection: 'upi' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('upi')

  // Shipping Fee configuration
  const shippingFee = cart.length > 0 ? 80 : 0
  const codFee = paymentMethod === 'cod' ? 0 : 0 // Flat shipping ₹80 applies to all
  const totalAmount = subtotal + shippingFee + codFee

  // Checkout step state: 'cart' | 'address' | 'payment' | 'confirmed'
  const [step, setStep] = useState('cart')
  const [submitting, setSubmitting] = useState(false)
  const [utrError, setUtrError] = useState(null)

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

  // UTR / Transaction Reference & Created Order
  const [utr, setUtr] = useState('')
  const [orderId, setOrderId] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    setStep('payment')
  }

  const handlePaymentConfirm = async (e) => {
    e.preventDefault()
    setUtrError(null)

    const cleanUtr = utr.trim()

    // If UPI payment selected, enforce strict 12-digit UTR validation
    if (paymentMethod === 'upi') {
      if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        setUtrError('Please enter a valid 12-digit numeric UTR / Transaction Reference number from your UPI app.')
        return
      }
    }

    setSubmitting(true)

    const generatedId = `DT-${Math.floor(100000 + Math.random() * 900000)}`
    const orderPayload = {
      orderId: generatedId,
      customer: formData,
      items: cart,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod: paymentMethod === 'upi' ? 'UPI Online' : 'Cash on Delivery (COD)',
      utr: paymentMethod === 'upi' ? cleanUtr : 'N/A (Cash on Delivery)',
      status: paymentMethod === 'upi' ? 'Pending Payment Verification' : 'COD Order - Awaiting Dispatch',
    }

    try {
      // POST order to backend API route /api/orders
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
    }
  }

  // UPI URL & QR Code API
  const upiId = 'dualturf@upi'
  const payeeName = 'DualTurf Store'
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR`
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`

  // Format WhatsApp message for Seller (+91-7656072801)
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

💳 *Payment Details:*
• Payment Mode: ${placedOrder.paymentMethod}
• Subtotal: ₹${placedOrder.subtotal}
• Shipping Fee: ₹${placedOrder.shippingFee || 80}
• Total Amount: ₹${placedOrder.totalAmount}
• UTR / Ref ID: ${placedOrder.utr}`

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
              <p>Explore our premium 2026-27 season kits and retro jerseys to get started!</p>
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
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
            SHIPPING ADDRESS
          </h1>

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
                SELECT PAYMENT METHOD →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: SELECT PAYMENT METHOD (UPI OR COD) */}
      {step === 'payment' && (
        <div className={styles.upiContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            CHOOSE PAYMENT METHOD
          </h1>

          {/* Payment Method Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              style={{
                backgroundColor: paymentMethod === 'upi' ? 'var(--accent-color)' : '#111111',
                color: paymentMethod === 'upi' ? '#000000' : '#ffffff',
                border: paymentMethod === 'upi' ? '2px solid var(--accent-color)' : '1px solid #333333',
                padding: '1.25rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              📱 UPI QR / Online
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>GPay, PhonePe, Paytm, BHIM</span>
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
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>Pay Cash Upon Delivery</span>
            </button>
          </div>

          {/* OPTION A: UPI PAYMENT */}
          {paymentMethod === 'upi' && (
            <div className={styles.upiBox}>
              <div className={styles.qrSection}>
                <div className={styles.qrCard}>
                  <img src={qrCodeApiUrl} alt="UPI QR Code" className={styles.qrCodeImg} />
                  <span className={styles.amountBadge}>Amount to Pay: ₹{totalAmount}</span>
                </div>
                <p className={styles.qrHint}>Supports GPay • PhonePe • Paytm • BHIM • CRED</p>
              </div>

              <div className={styles.upiDetails}>
                <div className={styles.detailRow}>
                  <span>Payee VPA:</span>
                  <strong className={styles.upiId}>{upiId}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Payee Name:</span>
                  <strong>{payeeName}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Subtotal:</span>
                  <strong>₹{subtotal}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Flat Express Shipping:</span>
                  <strong>₹{shippingFee}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Total Amount:</span>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '1.25rem' }}>₹{totalAmount}</strong>
                </div>

                <hr className={styles.divider} />

                <form onSubmit={handlePaymentConfirm} className={styles.utrForm}>
                  <label style={{ fontWeight: '700', color: 'var(--accent-color)' }}>
                    Enter 12-Digit UPI UTR / Ref No. *
                  </label>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Open your UPI app after paying ₹{totalAmount} to copy the 12-digit UTR/Ref ID.
                  </p>

                  {utrError && (
                    <div style={{ backgroundColor: 'rgba(255, 85, 85, 0.15)', border: '1px solid #ff5555', color: '#ff7777', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                      {utrError}
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    maxLength={12}
                    minLength={12}
                    pattern="\d{12}"
                    placeholder="Enter 12-digit UTR (e.g. 420819482019)"
                    value={utr}
                    onChange={(e) => {
                      setUtr(e.target.value.replace(/\D/g, ''))
                      setUtrError(null)
                    }}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '4px',
                      border: '1px solid var(--accent-color)',
                      backgroundColor: '#0a0a0a',
                      color: '#ffffff',
                      fontSize: '1rem',
                      letterSpacing: '0.1em',
                      fontFamily: 'monospace',
                    }}
                  />

                  <div className={styles.formActions} style={{ marginTop: '1.5rem' }}>
                    <button type="button" className="btn-outline" onClick={() => setStep('address')}>
                      ← Edit Address
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'VERIFYING UTR...' : 'SUBMIT UTR & PLACE ORDER ✓'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* OPTION B: CASH ON DELIVERY (COD) */}
          {paymentMethod === 'cod' && (
            <div className={styles.upiBox} style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
              <div className={styles.upiDetails}>
                <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.25rem' }}>
                  💵 CASH ON DELIVERY (COD)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Pay cash directly to the courier delivery executive upon arrival at your doorstep.
                </p>

                <div className={styles.detailRow}>
                  <span>Subtotal:</span>
                  <strong>₹{subtotal}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Flat Express Shipping:</span>
                  <strong>₹{shippingFee}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Total Amount to Pay on Delivery:</span>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '1.25rem' }}>₹{totalAmount}</strong>
                </div>

                <hr className={styles.divider} />

                <form onSubmit={handlePaymentConfirm} className={styles.utrForm}>
                  <div className={styles.formActions} style={{ marginTop: '1.5rem' }}>
                    <button type="button" className="btn-outline" onClick={() => setStep('address')}>
                      ← Edit Address
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'PLACING COD ORDER...' : 'CONFIRM CASH ON DELIVERY ORDER ✓'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: ORDER CONFIRMED */}
      {step === 'confirmed' && placedOrder && (
        <div className={styles.confirmedBox}>
          <div className={styles.successIcon}>✓</div>
          <h1 className="font-display" style={{ fontSize: '3rem', color: 'var(--accent-color)' }}>
            {placedOrder.paymentMethod.includes('COD') ? 'COD ORDER PLACED!' : 'UPI ORDER PLACED!'}
          </h1>
          <p className={styles.orderIdText}>
            Order Reference ID: <strong>#{orderId}</strong>
          </p>

          <div style={{ backgroundColor: 'rgba(196, 255, 61, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '1.25rem', margin: '1.5rem 0', textAlign: 'left' }}>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              {placedOrder.paymentMethod.includes('COD') ? '💵 Cash on Delivery Confirmation' : '⚠️ Final Step: Verify Payment via WhatsApp'}
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'rgba(255,255,255,0.9)', margin: '0.4rem 0' }}>
              {placedOrder.paymentMethod.includes('COD')
                ? `Please keep ₹${placedOrder.totalAmount} cash ready for delivery. Our team will contact you before dispatch.`
                : `Your order has been recorded with UTR ${placedOrder.utr}. Please send details to WhatsApp support.`}
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
              📱 SEND ORDER DETAILS TO WHATSAPP (+91-7656072801) →
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
