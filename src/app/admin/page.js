'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('dualturf_admin_token') : '';
}

function StatusBadge({ status }) {
  const s = status || '';
  let cls = styles.badgeGray;
  if (s.includes('Delivered')) cls = styles.badgeGreen;
  else if (s.includes('Shipped')) cls = styles.badgeBlue;
  else if (s.includes('Verified')) cls = styles.badgeYellow;
  else if (s.includes('Cancelled') || s.includes('Return')) cls = styles.badgeRed;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const fetchData = useCallback(async () => {
    const token = getToken();
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'x-admin-token': token } }),
        fetch('/api/orders', { headers: { 'x-admin-token': token } }),
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success) setRecentOrders((ordersData.orders || []).slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  // Calculate chart metrics
  const chartData = stats?.revenueByDay || [];
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const total30dRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const peakDay = chartData.reduce((max, d) => (d.revenue > (max?.revenue || 0) ? d : max), null);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>DualTurf store overview</p>
        </div>
        <button onClick={fetchData} className={styles.btnOutline}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading stats...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Revenue</span>
              <span className={styles.statValue}>{formatINR(stats?.totalRevenue)}</span>
              <span className={styles.statSub}>All time</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Orders</span>
              <span className={styles.statValue}>{stats?.totalOrders || 0}</span>
              <span className={styles.statSub}>All time</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Today's Orders</span>
              <span className={styles.statValue}>{stats?.todayOrders || 0}</span>
              <span className={styles.statSub}>{formatINR(stats?.todayRevenue)} today</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pending Verification</span>
              <span className={styles.statValue}>
                {(stats?.statusCounts?.['Pending Verification'] || 0) +
                 (stats?.statusCounts?.['New Order - Awaiting Verification'] || 0)}
              </span>
              <span className={styles.statSub}>Needs attention</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Shipped</span>
              <span className={styles.statValue}>{stats?.statusCounts?.['Shipped'] || 0}</span>
              <span className={styles.statSub}>In transit</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Delivered</span>
              <span className={styles.statValue}>{stats?.statusCounts?.['Delivered'] || 0}</span>
              <span className={styles.statSub}>Completed</span>
            </div>
          </div>

          {/* Enhanced Revenue Chart */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionTitle}>Revenue — Last 30 Days</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginLeft: '0.75rem' }}>
                  30D Total: <strong style={{ color: '#c4ff3d' }}>{formatINR(total30dRevenue)}</strong>
                </span>
              </div>

              {/* Dynamic Readout */}
              <div className={styles.chartReadout}>
                {hoveredDay ? (
                  <span className={styles.chartTooltipActive}>
                    📅 {new Date(hoveredDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: <strong>{formatINR(hoveredDay.revenue)}</strong>
                  </span>
                ) : peakDay && peakDay.revenue > 0 ? (
                  <span className={styles.chartTooltipIdle}>
                    ⭐ Peak: <strong style={{ color: '#c4ff3d' }}>{formatINR(peakDay.revenue)}</strong> on {new Date(peakDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                ) : (
                  <span className={styles.chartTooltipIdle}>Hover / tap any bar to see amount</span>
                )}
              </div>
            </div>

            {/* Y-Axis Value Labels + Bars Container */}
            <div className={styles.chartContainer}>
              <div className={styles.chartYAxis}>
                <span>{formatINR(maxRevenue)}</span>
                <span>{formatINR(Math.round(maxRevenue / 2))}</span>
                <span>₹0</span>
              </div>

              <div className={styles.chartContentArea}>
                <div className={styles.chartGridLines}>
                  <div className={styles.gridLine} style={{ top: '0%' }} />
                  <div className={styles.gridLine} style={{ top: '50%' }} />
                  <div className={styles.gridLine} style={{ top: '100%' }} />
                </div>

                <div className={styles.chartWrap} onMouseLeave={() => setHoveredDay(null)}>
                  {chartData.map((d) => {
                    const isHovered = hoveredDay?.date === d.date;
                    const heightPercent = Math.max(d.revenue > 0 ? 8 : 3, (d.revenue / maxRevenue) * 100);
                    return (
                      <div
                        key={d.date}
                        className={`${styles.chartBarWrapper} ${isHovered ? styles.chartBarActive : ''}`}
                        onMouseEnter={() => setHoveredDay(d)}
                        onClick={() => setHoveredDay(d)}
                        title={`${d.date}: ${formatINR(d.revenue)}`}
                      >
                        <div
                          className={styles.chartBar}
                          style={{
                            height: `${heightPercent}%`,
                            background: d.revenue > 0
                              ? isHovered ? '#c4ff3d' : 'linear-gradient(180deg, #c4ff3d 0%, rgba(196,255,61,0.3) 100%)'
                              : 'rgba(255,255,255,0.05)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Date Milestone Labels */}
            {chartData.length > 0 && (
              <div className={styles.chartXAxis}>
                <span>{new Date(chartData[0]?.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span>{new Date(chartData[Math.floor(chartData.length / 3)]?.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span>{new Date(chartData[Math.floor((chartData.length * 2) / 3)]?.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span style={{ color: '#c4ff3d', fontWeight: 600 }}>Today</span>
              </div>
            )}

            {chartData.length === 0 && (
              <div className={styles.empty}>No order data yet</div>
            )}
          </div>

          <div className={styles.dashboardTwoCol}>
            {/* Top Products */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Top Products</span>
              </div>
              {(stats?.topProducts || []).length === 0 ? (
                <div className={styles.empty}>No data yet</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: 'right' }}>Units Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.topProducts || []).map((p, i) => (
                        <tr key={i}>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                          <td style={{ textAlign: 'right', color: '#c4ff3d', fontWeight: 700 }}>{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>By Status</span>
              </div>
              {Object.keys(stats?.statusCounts || {}).length === 0 ? (
                <div className={styles.empty}>No data yet</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Status</th><th style={{ textAlign: 'right' }}>Count</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats?.statusCounts || {}).map(([status, count]) => (
                        <tr key={status}>
                          <td><StatusBadge status={status} /></td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className={styles.section} style={{ marginTop: '1.5rem' }}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent Orders</span>
              <Link href="/admin/orders" className={styles.btnOutline}>View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className={styles.empty}>No orders yet</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className={`${styles.tableWrap} ${styles.desktopOnly}`}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.orderId}>
                          <td style={{ fontFamily: 'monospace', color: '#c4ff3d', whiteSpace: 'nowrap' }}>#{o.orderId}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{o.customer?.fullName || 'N/A'}</td>
                          <td>{o.items?.length || 0}</td>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatINR(o.totalAmount)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}><StatusBadge status={o.status} /></td>
                          <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            {new Date(o.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Tap-to-Expand Accordion View */}
                <div className={styles.mobileOnly}>
                  <div className={styles.accordionList}>
                    {recentOrders.map(o => {
                      const isExpanded = expandedOrderId === o.orderId;
                      return (
                        <div
                          key={o.orderId}
                          className={`${styles.accordionItem} ${isExpanded ? styles.accordionItemOpen : ''}`}
                        >
                          <div
                            className={styles.accordionHeader}
                            onClick={() => setExpandedOrderId(prev => prev === o.orderId ? null : o.orderId)}
                          >
                            <div className={styles.accordionMainInfo}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '8px',
                                background: 'rgba(196,255,61,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', flexShrink: 0,
                              }}>
                                📦
                              </div>
                              <div className={styles.accordionTitleCol}>
                                <div className={styles.accordionTitle}>
                                  <span style={{ color: '#c4ff3d', fontFamily: 'monospace', marginRight: '0.4rem' }}>#{o.orderId}</span>
                                  {o.customer?.fullName || 'Customer'}
                                </div>
                                <div className={styles.accordionSubInfo}>
                                  <span className={styles.priceHighlight}>{formatINR(o.totalAmount)}</span>
                                  <StatusBadge status={o.status} />
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
                                <div className={styles.accordionDetail}>
                                  <span className={styles.accordionDetailLabel}>Customer Phone</span>
                                  <span>{o.customer?.phone || 'N/A'}</span>
                                </div>
                                <div className={styles.accordionDetail}>
                                  <span className={styles.accordionDetailLabel}>Order Date</span>
                                  <span>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div className={styles.accordionDetail}>
                                  <span className={styles.accordionDetailLabel}>Items Count</span>
                                  <span>{o.items?.length || 0} item(s)</span>
                                </div>
                                <div className={styles.accordionDetail}>
                                  <span className={styles.accordionDetailLabel}>Payment Mode</span>
                                  <span>{o.paymentMethod || 'Online'}</span>
                                </div>
                              </div>
                              <div className={styles.accordionActions}>
                                <Link
                                  href="/admin/orders"
                                  className={styles.btnPrimary}
                                  style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                                >
                                  Manage in Orders →
                                </Link>
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
        </>
      )}
    </div>
  );
}
