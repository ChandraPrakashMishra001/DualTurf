'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

function LoginForm() {
  const searchParams = useSearchParams();
  const { currentUser, userProfile, userOrders, login, loginWithGoogle, logout } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccessMsg('Account created successfully! You are now logged in.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(formData.email, formData.password);
      setSuccessMsg('Welcome back!');
    } catch (err) {
      let msg = 'Invalid email or password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = 'No account found with this email or invalid password.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      setSuccessMsg('Signed in with Google!');
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email || 'Customer';

  if (currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper} style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 className={styles.title}>My Account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
              Welcome back, <strong style={{ color: 'var(--accent-color)' }}>{displayName}</strong>!
            </p>
          </div>

          {/* User Info Card */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem', marginBottom: '2.5rem' }}>
            <h3 style={{ color: 'var(--accent-color)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              👤 Account Details
            </h3>
            <p style={{ margin: '0.4rem 0' }}><strong>Name:</strong> {displayName}</p>
            <p style={{ margin: '0.4rem 0' }}><strong>Email:</strong> {currentUser.email}</p>
            <p style={{ margin: '0.4rem 0', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
              Member Status: <span style={{ color: '#25D366', fontWeight: 600 }}>Active (Firebase Verified)</span>
            </p>
          </div>

          {/* Order History */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem', marginBottom: '2.5rem' }}>
            <h3 style={{ color: 'var(--accent-color)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              📦 Order History ({userOrders.length})
            </h3>

            {userOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                You haven't placed any orders yet. Once you place an order, your complete order history will be saved here permanently.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {userOrders.map((ord) => (
                  <div key={ord.id || ord.orderId} style={{ backgroundColor: '#111111', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Order #{ord.orderId}</strong>
                      <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem' }}>{ord.status || 'Processing'}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Total: ₹{ord.totalAmount || ord.subtotal} • Items: {ord.items?.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/collections/all" className="btn-primary">
              CONTINUE SHOPPING →
            </Link>
            <button type="button" className="btn-outline" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Login</h1>
        
        {successMsg && (
          <div style={{ backgroundColor: 'rgba(196, 255, 61, 0.15)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
            ✓ {successMsg}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 85, 85, 0.15)', border: '1px solid #ff5555', color: '#ff7777', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: 'none',
            padding: '0.875rem 1rem',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            transition: 'background-color 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#666' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              className={styles.input} 
              required 
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              className={styles.input} 
              required 
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className={styles.links}>
          <Link href="/account/register" className={styles.link}>Create account</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
