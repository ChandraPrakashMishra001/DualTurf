'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      register(formData.firstName, formData.lastName, formData.email, formData.password);
      router.push('/account/login?registered=true');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Create Account</h1>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(255, 85, 85, 0.15)', border: '1px solid #ff5555', color: '#ff7777', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input 
              type="text" 
              name="firstName" 
              placeholder="First Name" 
              className={styles.input} 
              required 
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <input 
              type="text" 
              name="lastName" 
              placeholder="Last Name" 
              className={styles.input} 
              required 
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
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
              minLength={6}
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className={styles.links}>
          <Link href="/account/login" className={styles.link}>Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
