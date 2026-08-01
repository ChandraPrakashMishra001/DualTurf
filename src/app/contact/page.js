'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const text = `💬 *NEW CONTACT INQUIRY - DUALTURF*

👤 *Name:* ${formData.name}
✉️ *Email:* ${formData.email}
📞 *Phone:* ${formData.phone}

📝 *Message:*
${formData.message}`;

    const waUrl = `https://wa.me/917656072801?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>We'd love to hear from you. Our team is here to help.</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.formSection}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input 
                type="text" 
                id="name" 
                required 
                placeholder="Your name" 
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  placeholder="Your email address" 
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  required 
                  placeholder="Your 10-digit phone number" 
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="message">Message *</label>
              <textarea 
                id="message" 
                rows="6" 
                required 
                placeholder="How can we help you?"
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <button type="submit" className={styles.submitBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              📱 SUBMIT & SEND TO WHATSAPP →
            </button>
          </form>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>Email</h3>
            <p><a href="mailto:turfdual@gmail.com" style={{ color: '#fff', textDecoration: 'underline' }}>turfdual@gmail.com</a></p>
          </div>

          <div className={styles.infoCard}>
            <h3>Phone / WhatsApp</h3>
            <p><a href="tel:+917656072801" style={{ color: '#fff', textDecoration: 'underline' }}>+91-7656072801</a></p>
          </div>
          
          <div className={styles.infoCard}>
            <h3>Location</h3>
            <p>Burla, Sambalpur</p>
            <p>Odisha, India</p>
          </div>
          
          <div className={styles.infoCard}>
            <h3>Follow us</h3>
            <a 
              href="https://www.instagram.com/dualturf?igsh=djAxYnlwOWs2NWM3" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.socialLink}
            >
              Instagram (@dualturf) ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
