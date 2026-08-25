'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../admin.module.css';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('dualturf_admin_token') : '';
}

const STATUSES = ['All', 'New Order - Awaiting Verification', 'Pending Verification', 'Payment Verified', 'Shipped', 'Delivered', 'Cancelled'];

function StatusBadge({ status }) {
  const s = status || '';
  let cls = styles.badgeGray;
  if (s.includes('Delivered')) cls = styles.badgeGreen;
  else if (s.includes('Shipped')) cls = styles.badgeBlue;
  else if (s.includes('Verified') && !s.includes('Awaiting')) cls = styles.badgeYellow;
  else if (s.includes('Cancelled') || s.includes('Return')) cls = styles.badgeRed;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (order, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, firestoreId: order.firestoreId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.orderId === order.orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      o.orderId?.toLowerCase().includes(q) ||
      o.customer?.fullName?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q) ||
      o.utr?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageSub}>{orders.length} total orders · {filtered.length} shown</p>
        </div>
        <button onClick={fetchOrders} className={styles.btnOutline}>🔄 Refresh</button>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by Order ID, name, phone, email, UTR..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterScroll} style={{ marginTop: '-0.25rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center', whiteSpace: 'nowrap', paddingRight: '0.25rem' }}>Filter:</span>
        {STATUSES.map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`${styles.filterBtn} ${filterStatus === st ? styles.filterBtnActive : ''}`}
          >
            {st === 'All' ? 'All' : st.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No orders match your filters.</div>
      ) : (
        <div>
          {filtered.map(order => (
            <div key={order.orderId} className={styles.orderCard}>
              {/* Card Header */}
              <div className={styles.orderCardHeader}>
                <div>
                  <span className={styles.orderIdBadge}>#{order.orderId}</span>
                  <span className={styles.orderTime}>
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <select
                  value={order.status}
                  onChange={e => updateStatus(order, e.target.value)}
                  className={styles.statusSelect}
                >
                  {STATUSES.filter(s => s !== 'All').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Card Body */}
              <div className={styles.orderBody}>
                {/* Customer */}
                <div className={styles.orderInfoCol}>
                  <h4>👤 Customer</h4>
                  <p><strong>{order.customer?.fullName || 'N/A'}</strong></p>
                  <p>
                    <a
                      href={`https://wa.me/91${order.customer?.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.waLink}
                    >
                      📱 {order.customer?.phone}
                    </a>
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>{order.customer?.email}</p>
                </div>

                {/* Address */}
                <div className={styles.orderInfoCol}>
                  <h4>📍 Delivery Address</h4>
                  <p>{order.customer?.address}</p>
                  <p>{order.customer?.city}, {order.customer?.state} — <strong>{order.customer?.pincode}</strong></p>
                </div>

                {/* Items */}
                <div className={styles.orderInfoCol}>
                  <h4>⚽ Items ({order.items?.length || 0})</h4>
                  <ul className={styles.itemsList}>
                    {(order.items || []).map((item, idx) => (
                      <li key={idx}>
                        {item.title} · {item.size} × {item.quantity} — {formatINR(item.price * item.quantity)}
                        {(item.customName || item.customNumber) && (
                          <span style={{ color: '#c4ff3d', marginLeft: '0.25rem' }}>
                            [⚡ {item.customName} {item.customNumber ? '#' + item.customNumber : ''}]
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    Subtotal: {formatINR(order.subtotal)} · Shipping: {formatINR(order.shippingFee)}
                    {order.codFee > 0 && ` · COD Fee: ${formatINR(order.codFee)}`}
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    Total: <span className={styles.totalVal}>{formatINR(order.totalAmount)}</span>
                  </div>
                  {order.advanceAmount > 0 && (
                    <div style={{ color: '#c4ff3d', fontSize: '0.78rem' }}>⚡ Advance Paid: {formatINR(order.advanceAmount)}</div>
                  )}
                  {order.balanceCOD > 0 && (
                    <div style={{ fontSize: '0.78rem' }}>💵 Collect on Delivery: {formatINR(order.balanceCOD)}</div>
                  )}
                </div>

                {/* Payment */}
                <div className={styles.orderInfoCol}>
                  <h4>💳 Payment</h4>
                  <p><strong>Method:</strong> {order.paymentMethod}</p>
                  <p><strong>UPI ID:</strong> dualturf@upi</p>
                  <p><strong>UTR / Ref:</strong> <code className={styles.utrCode}>{order.utr || 'Not provided'}</code></p>
                  <a
                    href={`https://wa.me/91${order.customer?.phone}?text=${encodeURIComponent(`Hi ${order.customer?.fullName}, thank you for ordering from DualTurf! Your Order #${order.orderId} status is: ${order.status}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.btnOutline}
                    style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    💬 WhatsApp Buyer
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
