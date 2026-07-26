'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev =>
          prev.map(o => (o.orderId === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderId?.toLowerCase().includes(q) ||
      o.customer?.fullName?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q) ||
      o.utr?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className={styles.container}>
      <div className={styles.adminHeader}>
        <div>
          <h1 className="font-display" style={{ fontSize: '3rem', color: 'var(--accent-color)' }}>
            SELLER DASHBOARD
          </h1>
          <p className={styles.subtext}>Manage customer orders, addresses & UPI payment verifications</p>
        </div>
        <button onClick={fetchOrders} className="btn-outline">
          🔄 Refresh Orders
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Phone, or UTR..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span>Filter Status:</span>
          {['All', 'Pending Verification', 'Payment Verified', 'Shipped', 'Delivered'].map(st => (
            <button
              key={st}
              className={`${styles.filterTab} ${filterStatus === st ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className={styles.loadingBox}>Loading incoming seller orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>No orders found matching your filter criteria.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map(order => (
            <div key={order.orderId} className={styles.orderCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.orderIdBadge}>#{order.orderId}</span>
                  <span className={styles.orderTime}>
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.statusBox}>
                  <select
                    value={order.status}
                    onChange={e => updateOrderStatus(order.orderId, e.target.value)}
                    className={`${styles.statusSelect} ${styles['status_' + order.status.replace(/\s+/g, '')]}`}
                  >
                    <option value="Pending Verification">⏳ Pending Verification</option>
                    <option value="Payment Verified">✅ Payment Verified</option>
                    <option value="Shipped">🚚 Shipped</option>
                    <option value="Delivered">🎉 Delivered</option>
                  </select>
                </div>
              </div>

              <div className={styles.cardBody}>
                {/* Customer Info */}
                <div className={styles.infoCol}>
                  <h4>👤 Customer Info</h4>
                  <p><strong>Name:</strong> {order.customer?.fullName || 'N/A'}</p>
                  <p><strong>Phone / WA:</strong> <a href={`https://wa.me/91${order.customer?.phone}`} target="_blank" rel="noreferrer" className={styles.waLink}>📱 {order.customer?.phone}</a></p>
                  <p><strong>Email:</strong> {order.customer?.email}</p>
                </div>

                {/* Delivery Address */}
                <div className={styles.infoCol}>
                  <h4>📍 Delivery Address</h4>
                  <p>{order.customer?.address}</p>
                  <p>{order.customer?.city}, {order.customer?.state} - <strong>{order.customer?.pincode}</strong></p>
                </div>

                {/* Items Ordered */}
                <div className={styles.infoCol}>
                  <h4>⚽ Ordered Items ({order.items?.length})</h4>
                  <ul className={styles.itemsList}>
                    {order.items?.map((item, idx) => (
                      <li key={idx}>
                        <span>{item.title}</span> (Size: {item.size}) x {item.quantity} - ₹{item.price * item.quantity}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.totalRow}>
                    <span>Total Amount Paid:</span>
                    <strong className={styles.totalVal}>₹{order.subtotal}</strong>
                  </div>
                </div>

                {/* Payment & UTR */}
                <div className={styles.infoCol}>
                  <h4>💳 Payment Details</h4>
                  <p><strong>Method:</strong> UPI Scan & Pay</p>
                  <p><strong>UPI ID:</strong> dualturf@upi</p>
                  <p><strong>UTR / Ref No:</strong> <code className={styles.utrCode}>{order.utr || 'Not Provided'}</code></p>
                  <a
                    href={`https://wa.me/91${order.customer?.phone}?text=${encodeURIComponent(`Hi ${order.customer?.fullName}, thank you for ordering from DualTurf! Your Order #${order.orderId} status is: ${order.status}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline"
                    style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                  >
                    💬 Chat with Buyer on WA
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
