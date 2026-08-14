export const metadata = {
  title: 'Privacy Policy - DualTurf',
}

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-light)' }}>
        <h1 className="font-display" style={{ marginBottom: '2rem', color: '#c4ff3d' }}>Privacy Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          <p>Last updated: August 2026</p>
          
          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>1. Information We Collect</h2>
            <p>At DualTurf, we collect information that you provide directly to us when you make a purchase, create an account, or contact us for support. This may include your name, email address, shipping address, and phone number.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
            <p>We use the information we collect to process your orders, send order confirmations and shipping updates via WhatsApp and email, and provide customer support.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>3. Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to provide the services you requested (e.g., sharing your address with our delivery partners).</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>4. Data Security</h2>
            <p>We implement a variety of security measures to maintain the safety of your personal information. All transactions are processed through secure gateway providers and are not stored or processed on our servers.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at turfdual@gmail.com.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
