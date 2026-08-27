'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../admin.module.css';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('dualturf_admin_token') : '';
}

const STATUSES = [
  'All',
  'New Order - Awaiting Verification',
  'Pending Verification',
  'Payment Verified',
  'Shipped',
  'Delivered',
  'Cancelled'
];

function StatusBadge({ status }) {
  const s = status || '';
  let cls = styles.badgeGray;
  if (s.includes('Delivered')) cls = styles.badgeGreen;
  else if (s.includes('Shipped')) cls = styles.badgeBlue;
  else if (s.includes('Verified')) cls = styles.badgeYellow;
  else if (s.includes('Cancelled') || s.includes('Return')) cls = styles.badgeRed;
  return <span className={`${styles.badge} ${cls}`}>{status.replace(' - Awaiting Verification', '')}</span>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchStatus;

    return (
      matchStatus && (
        o.orderId?.toLowerCase().includes(q) ||
        o.customer?.fullName?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o.customer?.city?.toLowerCase().includes(q) ||
        o.customer?.pincode?.includes(q) ||
        o.paymentId?.toLowerCase().includes(q)
      )
    );
  });

  const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageSub}>
            {orders.length} total orders · {filtered.length} showing
          </p>
        </div>
        <button onClick={fetchOrders} className={styles.btnOutline}>🔄 Refresh</button>
      </div>

      {/* Controls: Search & Filter */}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by Order ID, name, phone, city..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterScroll} style={{ marginTop: '-0.25rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center', whiteSpace: 'nowrap', paddingRight: '0.35rem' }}>
          Status:
        </span>
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
        <div className={styles.empty}>No orders match your search or filter.</div>
      ) : (
        <>
          {/* ── DESKTOP VIEW: Clean Table ────────────────────────── */}
          <div className={`${styles.section} ${styles.desktopOnly}`} style={{ padding: 0, overflow: 'hidden' }}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const isPartial = (order.paymentMethod || '').toLowerCase().includes('partial') || (order.advanceAmount > 0 && order.balanceCOD > 0);
                    const cleanPhone = (order.customer?.phone || '').replace(/\D/g, '');
                    const waText = encodeURIComponent(`Hi ${order.customer?.fullName || ''}, thank you for ordering from DualTurf! Your Order #${order.orderId} status is: ${order.status}.`);

                    return (
                      <tr key={order.orderId}>
                        {/* Order ID & Date */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#c4ff3d', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            #{order.orderId}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {order.customer?.fullName || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                            {order.customer?.city || ''}{order.customer?.city && order.customer?.state ? ', ' : ''}{order.customer?.state || ''}
                          </div>
                        </td>

                        {/* Items */}
                        <td>
                          <div style={{ maxWidth: 260, fontSize: '0.8rem', lineHeight: 1.4 }}>
                            {(order.items || []).map((it, idx) => (
                              <div key={idx} style={{ color: 'rgba(255,255,255,0.85)' }}>
                                • {it.title} <span style={{ color: 'rgba(255,255,255,0.45)' }}>({it.size}) × {it.quantity}</span>
                                {(it.customName || it.customNumber) && (
                                  <span style={{ color: '#c4ff3d', fontSize: '0.72rem', display: 'block', marginLeft: 10 }}>
                                    ⚡ {it.customName} {it.customNumber ? '#' + it.customNumber : ''}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td>
                          <div style={{ fontWeight: 800, color: '#c4ff3d', fontSize: '0.95rem' }}>
                            {formatINR(order.totalAmount)}
                          </div>
                          {isPartial && (
                            <div style={{ fontSize: '0.7rem', color: '#ffb800' }}>
                              Adv: {formatINR(order.advanceAmount)}
                            </div>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td>
                          <span className={`${styles.badge} ${isPartial ? styles.badgeYellow : styles.badgeGreen}`}>
                            {isPartial ? 'Partial COD' : 'Online Paid'}
                          </span>
                        </td>

                        {/* Status Select */}
                        <td>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order, e.target.value)}
                            className={styles.statusSelect}
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                          >
                            {STATUSES.filter(s => s !== 'All').map(s => (
                              <option key={s} value={s}>{s.replace(' - Awaiting Verification', '')}</option>
                            ))}
                          </select>
                        </td>

                        {/* WhatsApp Action */}
                        <td>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.btnOutline}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#25d366', borderColor: 'rgba(37, 211, 102, 0.3)' }}
                              title="Chat on WhatsApp"
                            >
                              💬 Chat
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── MOBILE VIEW: Tap-to-Expand Accordion ─────────────── */}
          <div className={styles.mobileOnly}>
            <div className={styles.accordionList}>
              {filtered.map(order => {
                const isExpanded = expandedId === order.orderId;
                const isPartial = (order.paymentMethod || '').toLowerCase().includes('partial') || (order.advanceAmount > 0 && order.balanceCOD > 0);
                const cleanPhone = (order.customer?.phone || '').replace(/\D/g, '');
                const waText = encodeURIComponent(`Hi ${order.customer?.fullName || ''}, thank you for ordering from DualTurf! Your Order #${order.orderId} status is: ${order.status}.`);

                return (
                  <div
                    key={order.orderId}
                    className={`${styles.accordionItem} ${isExpanded ? styles.accordionItemOpen : ''}`}
                  >
                    {/* Collapsed Header */}
                    <div
                      className={styles.accordionHeader}
                      onClick={() => setExpandedId(prev => (prev === order.orderId ? null : order.orderId))}
                    >
                      <div className={styles.accordionMainInfo}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'rgba(196,255,61,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', color: '#c4ff3d', fontWeight: 800, flexShrink: 0,
                        }}>
                          ⚽
                        </div>
                        <div className={styles.accordionTitleCol}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#c4ff3d', fontSize: '0.85rem' }}>
                              #{order.orderId}
                            </span>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                              · {order.customer?.fullName || 'Customer'}
                            </span>
                          </div>
                          <div className={styles.accordionSubInfo}>
                            <span style={{ fontWeight: 700, color: '#c4ff3d', fontSize: '0.8rem' }}>
                              {formatINR(order.totalAmount)}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      </div>
                      <div className={styles.accordionChevron}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className={styles.accordionBody}>
                        <div className={styles.accordionDetailsGrid}>
                          {/* Items List */}
                          <div className={styles.accordionDetail} style={{ gridColumn: '1 / -1' }}>
                            <span className={styles.accordionDetailLabel}>Ordered Jerseys</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 3 }}>
                              {(order.items || []).map((it, idx) => (
                                <div key={idx} style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                                  <strong>{it.title}</strong> — Size: <span style={{ color: '#c4ff3d' }}>{it.size}</span> × {it.quantity}
                                  {(it.customName || it.customNumber) && (
                                    <div style={{ color: '#c4ff3d', fontSize: '0.75rem', marginTop: 1 }}>
                                      ⚡ Print: {it.customName} {it.customNumber ? '#' + it.customNumber : ''}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Customer Contact */}
                          <div className={styles.accordionDetail}>
                            <span className={styles.accordionDetailLabel}>Customer Phone</span>
                            <span>{order.customer?.phone || '—'}</span>
                          </div>

                          <div className={styles.accordionDetail}>
                            <span className={styles.accordionDetailLabel}>Payment</span>
                            <span style={{ color: isPartial ? '#ffb800' : '#c4ff3d', fontWeight: 600 }}>
                              {isPartial ? `Partial (Adv: ${formatINR(order.advanceAmount)})` : '100% Online Paid'}
                            </span>
                          </div>

                          {/* Address */}
                          <div className={styles.accordionDetail} style={{ gridColumn: '1 / -1' }}>
                            <span className={styles.accordionDetailLabel}>Delivery Address</span>
                            <span style={{ lineHeight: 1.4 }}>
                              {order.customer?.address ? `${order.customer?.address}, ` : ''}
                              {order.customer?.city}, {order.customer?.state} - <strong>{order.customer?.pincode}</strong>
                            </span>
                          </div>

                          {/* Payment Txn */}
                          {order.paymentId && order.paymentId !== 'N/A' && (
                            <div className={styles.accordionDetail} style={{ gridColumn: '1 / -1' }}>
                              <span className={styles.accordionDetailLabel}>Transaction ID</span>
                              <span style={{ fontFamily: 'monospace', color: '#c4ff3d', fontSize: '0.75rem' }}>
                                {order.paymentId}
                              </span>
                            </div>
                          )}

                          {/* Status Update Dropdown */}
                          <div className={styles.accordionDetail} style={{ gridColumn: '1 / -1' }}>
                            <span className={styles.accordionDetailLabel}>Update Status</span>
                            <select
                              value={order.status}
                              onChange={e => updateStatus(order, e.target.value)}
                              className={styles.statusSelect}
                              style={{ width: '100%', marginTop: 4 }}
                            >
                              {STATUSES.filter(s => s !== 'All').map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* WhatsApp Action Button */}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${waText}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnPrimary}
                            style={{
                              width: '100%',
                              marginTop: '0.75rem',
                              background: '#25d366',
                              color: '#000',
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontSize: '0.8rem',
                              padding: '0.6rem',
                            }}
                          >
                            💬 WhatsApp Customer
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
