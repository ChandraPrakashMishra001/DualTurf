'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import styles from './Orders.module.css'

export default function MyOrdersPage() {
  const { currentUser, userProfile, logout, updateSavedAddress, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  
  // Saved Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressNotice, setAddressNotice] = useState(null)

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/account/login')
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (currentUser?.email) {
      fetchOrders()
    }
  }, [currentUser])

  useEffect(() => {
    const saved = userProfile?.savedAddress || currentUser?.savedAddress
    if (saved) {
      setAddressForm({
        fullName: saved.fullName || currentUser?.name || '',
        phone: saved.phone || '',
        address: saved.address || '',
        city: saved.city || '',
        state: saved.state || '',
        pincode: saved.pincode || '',
      })
    } else if (currentUser) {
      setAddressForm(prev => ({
        ...prev,
        fullName: currentUser.name || '',
      }))
    }
  }, [currentUser, userProfile])

  const fetchOrders = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const ordersMap = new Map()

      // 1. Try local storage (instant)
      try {
        const localOrders = JSON.parse(localStorage.getItem('dualturf_customer_orders') || '[]')
        localOrders.forEach(o => {
          if (o.orderId) ordersMap.set(o.orderId, o)
        })
      } catch (e) {}

      // 2. Try Firestore queries
      try {
        if (currentUser.uid) {
          const qUid = query(collection(db, 'orders'), where('userId', '==', currentUser.uid))
          const snapUid = await getDocs(qUid)
          snapUid.forEach((docSnap) => {
            const data = docSnap.data()
            // Key by orderId (not doc ID) to deduplicate across write paths
            const key = data.orderId || docSnap.id
            ordersMap.set(key, { id: docSnap.id, ...data })
          })
        }
        if (currentUser.email) {
          const cleanEmail = currentUser.email.trim().toLowerCase()
          const qEmail = query(collection(db, 'orders'), where('customerEmail', '==', cleanEmail))
          const snapEmail = await getDocs(qEmail)
          snapEmail.forEach((docSnap) => {
            const data = docSnap.data()
            const key = data.orderId || docSnap.id
            ordersMap.set(key, { id: docSnap.id, ...data })
          })
        }
      } catch (fsErr) {
        console.warn('Firestore order fetch notice:', fsErr)
      }

      // 3. Try /api/orders
      try {
        const targetEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : ''
        if (targetEmail) {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(targetEmail)}`)
          const data = await res.json()
          if (data.success && Array.isArray(data.orders)) {
            data.orders.forEach(o => {
              if (o.orderId) ordersMap.set(o.orderId, o)
            })
          }
        }
      } catch (apiErr) {
        console.warn('API order fetch notice:', apiErr)
      }

      const merged = Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setOrders(merged)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setAddressNotice(null)
    try {
      await updateSavedAddress(addressForm)
      setAddressNotice('✅ Address saved! Checkout will automatically pre-fill with these details.')
      setTimeout(() => setAddressNotice(null), 4000)
    } catch (err) {
      setAddressNotice('❌ Failed to save address. Please try again.')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleAction = async (orderId, newStatus) => {
    if (newStatus === 'Cancelled') {
      const confirm = window.confirm('Are you sure you want to cancel this order?')
      if (!confirm) return
    } else if (newStatus === 'Replacement Requested' || newStatus === 'Return Requested') {
      const confirm = window.confirm('Are you sure you want to request a replacement? Our team will contact you shortly.')
      if (!confirm) return
    }

    try {
      setProcessingId(orderId)
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o))
        alert(`Order successfully updated to ${newStatus}`)
      } else {
        alert(data.message || 'Failed to update order')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred.')
    } finally {
      setProcessingId(null)
    }
  }

  // Fallback timeout to prevent infinite loading screen
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (authLoading && !currentUser && !loadingTimeout) {
    return (
      <div className="container" style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Verifying your account session...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container" style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>Please log in to access your account dashboard.</p>
        <Link href="/account/login" className="btn-primary">GO TO LOGIN →</Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}>
      <div className={styles.headerRow}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.8rem', color: '#fff' }}>My Dashboard</h1>
          <p className={styles.userSubtitle}>Welcome back, <strong>{currentUser.name || currentUser.email}</strong></p>
        </div>
        <button onClick={() => { logout(); router.push('/') }} className={styles.logoutBtn}>Logout</button>
      </div>

      {/* Saved Address Section */}
      <div className={styles.addressCard}>
        <div className={styles.addressHeader}>
          <h3>📍 Saved Shipping Address (Auto-Fills at Checkout)</h3>
          <span className={styles.expressBadge}>⚡ Fast Express Checkout</span>
        </div>

        {addressNotice && <p className={styles.addressNotice}>{addressNotice}</p>}

        <form onSubmit={handleSaveAddress} className={styles.addressFormGrid}>
          <div className={styles.fieldGroup}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={addressForm.fullName}
              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroupFull}>
            <label>Street / House / Colony Address</label>
            <input
              type="text"
              placeholder="House/Flat No, Building, Street, Area"
              value={addressForm.address}
              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>City</label>
            <input
              type="text"
              placeholder="e.g. Sambalpur"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>State</label>
            <input
              type="text"
              placeholder="e.g. Odisha"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Pincode</label>
            <input
              type="text"
              placeholder="e.g. 768017"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroupFull}>
            <button type="submit" disabled={savingAddress} className="btn-primary" style={{ width: 'auto', alignSelf: 'flex-start' }}>
              {savingAddress ? 'SAVING...' : 'SAVE ADDRESS FOR FAST CHECKOUT'}
            </button>
          </div>
        </form>
      </div>

      {/* Order History */}
      <h2 className={`font-display ${styles.sectionTitle}`}>Order History</h2>

      {loading ? (
        <p className={styles.loadingText}>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't placed any orders yet.</p>
          <Link href="/collections/all" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>START SHOPPING</Link>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders.map(order => {
            const isCancellable = order.status?.includes('New Order') || order.status?.includes('Processing') || order.status?.includes('COD Order')
            const isReturnable = order.status?.includes('Delivered')

            return (
              <div key={order.orderId} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <h3>Order #{order.orderId}</h3>
                    <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.orderStatusBadge}>
                    {order.status}
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className={styles.itemRow}>
                      <span className={styles.itemTitle}>{item.quantity}x {item.title} ({item.size})</span>
                      <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <span>Total Amount:</span>
                    <strong>₹{order.totalAmount}</strong>
                  </div>
                  
                  <div className={styles.actionButtons}>
                    {isCancellable && (
                      <button 
                        onClick={() => handleAction(order.orderId, 'Cancelled')}
                        disabled={processingId === order.orderId}
                        className={styles.cancelBtn}
                      >
                        {processingId === order.orderId ? 'Processing...' : 'Cancel Order'}
                      </button>
                    )}
                    
                    {isReturnable && (
                      <button 
                        onClick={() => handleAction(order.orderId, 'Replacement Requested')}
                        disabled={processingId === order.orderId}
                        className={styles.returnBtn}
                      >
                        {processingId === order.orderId ? 'Processing...' : 'Request Replacement'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
