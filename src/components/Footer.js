'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FOOTER_POLICIES } from '@/data/products'
import styles from './Footer.module.css'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const pathname = usePathname()
  if (pathname === '/coming-soon' || pathname === '/') return null

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          {/* Left: Policies */}
          <div className={styles.footerCol}>
            <h3 className={styles.colTitle}>POLICIES</h3>
            <ul className={styles.policyList}>
              {FOOTER_POLICIES.map((policy, idx) => (
                <li key={idx}>
                  <Link href={policy.href}>{policy.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Brand & Newsletter */}
          <div className={styles.footerCol}>
            {/* Logo Dual Turf */}
            <div className={styles.logoBox}>
              DUAL TURF
            </div>

            <h3 className={styles.newsletterTitle}>
              STAY IN THE LOOP WITH OUR WEEKLY NEWSLETTER
            </h3>

            <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" aria-label="Subscribe">
                →
              </button>
            </form>
            {subscribed && (
              <p className={styles.successMsg}>✓ You're subscribed!</p>
            )}

            <div className={styles.socialRow}>
              <a
                href="https://www.instagram.com/dualturf?igsh=djAxYnlwOWs2NWM3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <p>© 2026 DualTurf. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
