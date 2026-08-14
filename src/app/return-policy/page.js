export const metadata = {
  title: 'Return Policy - DualTurf',
}

export default function ReturnPolicy() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-light)' }}>
        <h1 className="font-display" style={{ marginBottom: '2rem', color: '#c4ff3d' }}>Return Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          <p>Last updated: August 2026</p>
          
          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>1. Returns</h2>
            <p>We accept returns within 7 days of delivery for items that are unused, in their original packaging, and with all tags attached. Please note that customized or personalized jerseys cannot be returned unless there is a manufacturing defect.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>2. Process</h2>
            <p>To initiate a return, please contact our support team via WhatsApp or email with your order number and photos of the product. Once approved, we will arrange for a pickup.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>3. Refunds</h2>
            <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed to your original method of payment within 5-7 business days.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
