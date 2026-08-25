'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../admin.module.css';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('dualturf_admin_token') : '';
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { 'x-admin-token': getToken() },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        if (data.note) setNote(data.note);
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Customers</h1>
          <p className={styles.pageSub}>{customers.length} registered users in Firebase</p>
        </div>
        <button onClick={fetchCustomers} className={styles.btnOutline}>🔄 Refresh</button>
      </div>

      {note && (
        <div style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#ffb800' }}>
          ⚠ Firestore note: {note}. You may need to create an index in Firebase console.
        </div>
      )}

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {customers.length === 0
            ? 'No registered users found. Users appear here when they sign up on the storefront.'
            : 'No customers match your search.'}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={`${styles.section} ${styles.desktopOnly}`} style={{ padding: 0, overflow: 'hidden' }}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer.firestoreId || customer.uid}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 160 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(196,255,61,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.85rem', color: '#c4ff3d', fontWeight: 700, flexShrink: 0,
                          }}>
                            {(customer.name || customer.firstName || customer.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                              {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'No name'}
                            </div>
                            {customer.savedAddress?.city && (
                              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                                📍 {customer.savedAddress.city}, {customer.savedAddress.state}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{customer.email}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`${styles.badge} ${customer.emailVerified ? styles.badgeGreen : styles.badgeGray}`}>
                          {customer.emailVerified ? '✓ Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <a
                          href={`mailto:${customer.email}`}
                          className={styles.btnOutline}
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                        >
                          ✉ Email
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Tap-to-Expand Accordion List */}
          <div className={styles.mobileOnly}>
            <div className={styles.accordionList}>
              {filtered.map(customer => {
                const custId = customer.firestoreId || customer.uid;
                const isExpanded = expandedId === custId;
                const initial = (customer.name || customer.firstName || customer.email || '?')[0].toUpperCase();
                const displayName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'No name';

                return (
                  <div
                    key={custId}
                    className={`${styles.accordionItem} ${isExpanded ? styles.accordionItemOpen : ''}`}
                  >
                    <div
                      className={styles.accordionHeader}
                      onClick={() => setExpandedId(prev => (prev === custId ? null : custId))}
                    >
                      <div className={styles.accordionMainInfo}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: 'rgba(196,255,61,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', color: '#c4ff3d', fontWeight: 700, flexShrink: 0,
                        }}>
                          {initial}
                        </div>
                        <div className={styles.accordionTitleCol}>
                          <div className={styles.accordionTitle}>{displayName}</div>
                          <div className={styles.accordionSubInfo}>
                            <span className={`${styles.badge} ${customer.emailVerified ? styles.badgeGreen : styles.badgeGray}`}>
                              {customer.emailVerified ? '✓ Verified' : 'Unverified'}
                            </span>
                            {customer.savedAddress?.city && (
                              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                                📍 {customer.savedAddress.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={styles.accordionChevron}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.accordionBody}>
                        <div className={styles.accordionDetailsGrid}>
                          <div className={styles.accordionDetail} style={{ gridColumn: '1 / -1' }}>
                            <span className={styles.accordionDetailLabel}>Email Address</span>
                            <span style={{ color: '#ffffff', wordBreak: 'break-all' }}>{customer.email}</span>
                          </div>
                          {customer.savedAddress && (
                            <div className={styles.accordionDetail} style={{ gridColumn: '1 / -1' }}>
                              <span className={styles.accordionDetailLabel}>Saved Address</span>
                              <span>
                                {customer.savedAddress.address ? `${customer.savedAddress.address}, ` : ''}
                                {customer.savedAddress.city}, {customer.savedAddress.state} - {customer.savedAddress.pincode}
                              </span>
                            </div>
                          )}
                          <div className={styles.accordionDetail}>
                            <span className={styles.accordionDetailLabel}>Joined Date</span>
                            <span>
                              {customer.createdAt
                                ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                            </span>
                          </div>
                          <div className={styles.accordionDetail}>
                            <span className={styles.accordionDetailLabel}>Status</span>
                            <span>{customer.emailVerified ? 'Email Verified' : 'Pending Verification'}</span>
                          </div>
                        </div>

                        <div className={styles.accordionActions}>
                          <a
                            href={`mailto:${customer.email}`}
                            className={styles.btnPrimary}
                            style={{ flex: 1, textDecoration: 'none' }}
                          >
                            ✉ Send Email to Customer
                          </a>
                        </div>
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
