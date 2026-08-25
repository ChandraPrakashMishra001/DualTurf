'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '⚡', exact: true },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/products', label: 'Products', icon: '⚽' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip auth check on the login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      return;
    }
    const token = sessionStorage.getItem('dualturf_admin_token');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [isLoginPage, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('dualturf_admin_token');
    router.push('/admin/login');
  };

  if (!authorized) return null;

  if (isLoginPage) return <>{children}</>;

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className={styles.shell}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrandRow}>
            <div>
              <span className={styles.brandName}>DUALTURF</span>
              <span className={styles.brandRole}>ADMIN</span>
            </div>
            <button
              className={styles.sidebarCloseBtn}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item) ? styles.navItemActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.siteLink} target="_blank">
            ↗ View Site
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            ⏏ Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span>☰</span>
            <span className={styles.menuBtnLabel}>Menu</span>
          </button>
          <div className={styles.topbarTitle}>
            {NAV_ITEMS.find(n => isActive(n))?.label || 'Admin'}
          </div>
          <button onClick={handleLogout} className={styles.topbarLogout}>
            ⏏ Logout
          </button>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
