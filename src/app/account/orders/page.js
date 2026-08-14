'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './Orders.module.css'

export default function MyOrdersPage() {
  const { currentUser, logout, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

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

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?email=${encodeURIComponent(currentUser.email)}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (orderId, newStatus) => {
    if (newStatus === 'Cancelled') {
      const confirm = window.confirm('Are you sure you want to cancel this order?')
      if (!confirm) return
    } else if (newStatus === 'Return Requested') {
      const confirm = window.confirm('Are you sure you want to request a return? Our team will contact you shortly.')
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

  if (authLoading || !currentUser) return null

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}>
      <div className={styles.headerRow}>
        <h1 className="font-display">My Dashboard</h1>
        <button onClick={() => { logout(); router.push('/') }} className={styles.logoutBtn}>Logout</button>
      </div>

      <div className={styles.userInfo}>
        <p>Logged in as: <strong>{currentUser.email}</strong></p>
      </div>

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
            const isCancellable = order.status?.includes('New Order') || order.status?.includes('Processing')
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
                        onClick={() => handleAction(order.orderId, 'Return Requested')}
                        disabled={processingId === order.orderId}
                        className={styles.returnBtn}
                      >
                        {processingId === order.orderId ? 'Processing...' : 'Request Return'}
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
