export const metadata = {
  title: 'Cancellation Policy - DualTurf',
}

export default function CancellationPolicy() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-light)' }}>
        <h1 className="font-display" style={{ marginBottom: '2rem', color: '#c4ff3d' }}>Cancellation Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          <p>Last updated: August 2026</p>
          
          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>1. Order Cancellations</h2>
            <p>You may cancel your order within 24 hours of placing it, provided it has not yet been dispatched. Once an order has been dispatched, it cannot be cancelled and must go through the standard return process.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>2. How to Cancel</h2>
            <p>To cancel an order, please immediately reply to your WhatsApp confirmation message or email us at turfdual@gmail.com with your Order ID.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>3. Cancellation by DualTurf</h2>
            <p>We reserve the right to cancel any order for any reason, including but not limited to inventory shortages, errors in pricing, or suspected fraudulent activity. If we cancel your order, we will notify you and process a full refund immediately.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
