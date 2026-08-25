'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('dualturf_admin_token', data.token);
        router.push('/admin');
      } else {
        setError(data.message || 'Incorrect password.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPassword('');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <form
        onSubmit={handleLogin}
        className={`${styles.card} ${shake ? styles.shake : ''}`}
      >
        <div className={styles.logo}>
          <span className={styles.logoText}>DUALTURF</span>
          <span className={styles.logoSub}>ADMIN PORTAL</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-password">
            Admin Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className={styles.input}
            autoFocus
            autoComplete="current-password"
          />
        </div>

        {error && <p className={styles.error}>⚠ {error}</p>}

        <button
          type="submit"
          className={styles.btn}
          disabled={loading || !password.trim()}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            'UNLOCK DASHBOARD →'
          )}
        </button>

        <p className={styles.hint}>Authorized personnel only</p>
      </form>
    </div>
  );
}
