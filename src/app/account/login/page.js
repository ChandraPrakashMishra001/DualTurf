'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

function LoginForm() {
  const searchParams = useSearchParams();
  const { currentUser, login, logout } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccessMsg('Account created successfully! You are now logged in.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    try {
      login(formData.email, formData.password);
      setSuccessMsg('Welcome back!');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  if (currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper} style={{ textAlign: 'center' }}>
          <h1 className={styles.title}>My Account</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            Welcome back, <strong style={{ color: 'var(--accent-color)' }}>{currentUser.name}</strong>!
          </p>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <p style={{ margin: '0.4rem 0' }}><strong>Name:</strong> {currentUser.name}</p>
            <p style={{ margin: '0.4rem 0' }}><strong>Email:</strong> {currentUser.email}</p>
            <p style={{ margin: '0.4rem 0', fontSize: '0.875rem', color: 'var(--text-dark)' }}>Member since: {new Date(currentUser.createdAt).toLocaleDateString()}</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
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
          
          <button type="submit" className={styles.submitBtn}>Sign In</button>
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
