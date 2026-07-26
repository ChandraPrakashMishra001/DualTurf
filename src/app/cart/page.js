'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './page.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart()

  // Checkout step state: 'cart' | 'address' | 'upi' | 'confirmed'
  const [step, setStep] = useState('cart')
  const [submitting, setSubmitting] = useState(false)

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
    setStep('upi')
  }

  const handlePaymentConfirm = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const generatedId = `DT-${Math.floor(100000 + Math.random() * 900000)}`
    const orderPayload = {
      orderId: generatedId,
      customer: formData,
      items: cart,
      subtotal,
      utr: utr || 'Not Provided',
      status: 'Pending Verification',
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
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${subtotal}&cu=INR`
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`

  // Format WhatsApp message for Seller (+91 98765 43210 or Seller number)
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
• Total Paid: ₹${placedOrder.subtotal}
• UPI VPA: ${upiId}
• UTR / Ref ID: ${placedOrder.utr}`

    return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`
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
        <div className={`${styles.stepNode} ${step === 'address' ? styles.activeNode : ''} ${step === 'upi' || step === 'confirmed' ? styles.completedNode : ''}`}>
          <span>2</span>
          <p>Shipping</p>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepNode} ${step === 'upi' ? styles.activeNode : ''} ${step === 'confirmed' ? styles.completedNode : ''}`}>
          <span>3</span>
          <p>UPI Payment</p>
        </div>
      </div>

      {/* STEP 1: CART REVIEW */}
      {step === 'cart' && (
        <>
          <h1 className="font-display title-underline" style={{ fontSize: '3.5rem', marginBottom: '2.5rem', textAlign: 'center' }}>
            YOUR CART
          </h1>

          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your cart is currently empty.</p>
              <Link href="/collections/all" className="btn-primary" style={{ marginTop: '1.5rem' }}>
                CONTINUE SHOPPING →
              </Link>
            </div>
          ) : (
            <div className={styles.cartLayout}>
              <div className={styles.cartItems}>
                <div className={styles.tableHeader}>
                  <div>Product</div>
                  <div>Price</div>
                  <div>Quantity</div>
                  <div>Total</div>
                </div>

                {cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${idx}`} className={styles.cartRow}>
                    <div className={styles.colProduct}>
                      <img src={item.image} alt={item.title} className={styles.itemImage} />
                      <div>
                        <h3 className={styles.itemName}>{item.title}</h3>
                        <p className={styles.itemVariant}>Size: {item.size}</p>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.id, item.size)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className={styles.colPrice}>₹{item.price}</div>
                    <div className={styles.colQuantity}>
                      <div className={styles.qtyBox}>
                        <button onClick={() => updateQuantity(item.id, item.size, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.size, 1)}>+</button>
                      </div>
                    </div>
                    <div className={styles.colTotal}>₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className={styles.summaryCard}>
                <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
                  ORDER SUMMARY
                </h2>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>FREE</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}>₹{subtotal}</span>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', height: '52px', marginTop: '1.5rem' }}
                  onClick={() => setStep('address')}
                >
                  PROCEED TO SHIPPING →
                </button>

                <Link href="/collections/all" className={styles.continueLink}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* STEP 2: SHIPPING & ADDRESS FORM */}
      {step === 'address' && (
        <div className={styles.formContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>
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
                <label>Phone / WhatsApp Number *</label>
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
              <label>Flat / House No. / Building / Street Address *</label>
              <input
                type="text"
                name="address"
                required
                placeholder="Apartment name, Street area"
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
                  placeholder="Mumbai"
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
                  placeholder="Maharashtra"
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
                  placeholder="400001"
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
                PROCEED TO UPI PAYMENT →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: GENERATED UPI QR CODE & PAYMENT */}
      {step === 'upi' && (
        <div className={styles.upiContainer}>
          <h1 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            SCAN & PAY VIA UPI
          </h1>
          <p className={styles.upiSubtext}>
            Scan the generated QR code below with any UPI App (GPay, PhonePe, Paytm, BHIM, CRED).
          </p>

          <div className={styles.upiBox}>
            <div className={styles.qrSection}>
              <div className={styles.qrCard}>
                <img src={qrCodeApiUrl} alt="UPI QR Code" className={styles.qrCodeImg} />
                <span className={styles.amountBadge}>Amount to Pay: ₹{subtotal}</span>
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
                <span>Total Amount:</span>
                <strong style={{ color: 'var(--accent-color)', fontSize: '1.25rem' }}>₹{subtotal}</strong>
              </div>

              <hr className={styles.divider} />

              <form onSubmit={handlePaymentConfirm} className={styles.utrForm}>
                <label>UPI Reference No. / UTR (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter 12-digit UTR or Transaction ID"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                />

                <div className={styles.formActions}>
                  <button type="button" className="btn-outline" onClick={() => setStep('address')}>
                    ← Edit Address
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'RECORDING ORDER...' : 'CONFIRM & PLACE ORDER ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ORDER CONFIRMED & SELLER DISPATCH */}
      {step === 'confirmed' && placedOrder && (
        <div className={styles.confirmedBox}>
          <div className={styles.successIcon}>✓</div>
          <h1 className="font-display" style={{ fontSize: '3.5rem', color: 'var(--accent-color)' }}>
            ORDER CONFIRMED!
          </h1>
          <p className={styles.orderIdText}>
            Order ID: <strong>#{orderId}</strong>
          </p>
          <p className={styles.confirmedSub}>
            Thank you, <strong>{placedOrder.customer.fullName}</strong>! Your order details have been sent to the seller database.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            <a
              href={generateWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ backgroundColor: '#25D366', color: '#000000' }}
            >
              📱 SEND ORDER CONFIRMATION TO SELLER VIA WHATSAPP →
            </a>

            <Link href="/admin/orders" className="btn-outline" target="_blank">
              ⚙️ View Order in Seller Dashboard
            </Link>
          </div>

          <div className={styles.deliveryCard}>
            <h3>Shipping Address & Details:</h3>
            <p><strong>Name:</strong> {placedOrder.customer.fullName}</p>
            <p><strong>Phone:</strong> {placedOrder.customer.phone}</p>
            <p><strong>Address:</strong> {placedOrder.customer.address}, {placedOrder.customer.city}, {placedOrder.customer.state} - {placedOrder.customer.pincode}</p>
            <p><strong>Payment UTR:</strong> {placedOrder.utr}</p>
            <p style={{ marginTop: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>
              🚚 Dispatches in 48 Hours via Express Courier
            </p>
          </div>

          <Link href="/" className="btn-primary" style={{ marginTop: '2rem' }}>
            BACK TO HOMEPAGE →
          </Link>
        </div>
      )}
    </div>
  )
}
