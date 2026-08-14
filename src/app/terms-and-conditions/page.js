export const metadata = {
  title: 'Terms and Conditions - DualTurf',
}

export default function TermsAndConditions() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-light)' }}>
        <h1 className="font-display" style={{ marginBottom: '2rem', color: '#c4ff3d' }}>Terms & Conditions</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          <p>Last updated: August 2026</p>
          
          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>1. Introduction</h2>
            <p>Welcome to DualTurf. By accessing our website and purchasing our products, you agree to be bound by these Terms and Conditions.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>2. Product Information</h2>
            <p>We strive to display the colors and images of our products as accurately as possible. However, we cannot guarantee that your computer monitor's display of any color will be completely accurate.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>3. Pricing and Payments</h2>
            <p>All prices are subject to change without notice. We reserve the right to modify or discontinue any product. We accept Cash on Delivery (COD) and various online payment methods as displayed during checkout.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>4. Shipping and Delivery</h2>
            <p>We aim to process and dispatch all orders promptly. Delivery times may vary depending on your location in India. DualTurf is not responsible for delays caused by the shipping carrier.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>5. User Accounts</h2>
            <p>If you create an account on our website, you are responsible for maintaining the security of your account and for all activities that occur under the account.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
