export const metadata = {
  title: 'Replacement Policy - DualTurf',
}

export default function ReturnPolicy() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-light)' }}>
        <h1 className="font-display" style={{ marginBottom: '2rem', color: '#c4ff3d' }}>Replacement Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          <p>Last updated: August 2026</p>
          
          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>1. Replacement Only Policy</h2>
            <p>At DualTurf, we operate strictly on a <strong>Replacement Only</strong> policy. We do not provide cash returns or refunds. Replacements are applicable under the following specific conditions:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Wrong Size Sent by Us:</strong> If you receive a size different from what you ordered in your order confirmation, we will replace it with the correct size at no extra cost.</li>
              <li><strong>Manufacturing Defects:</strong> If the jersey has a genuine manufacturing defect upon delivery (e.g., misprint, torn fabric, or defective crest), we will provide an immediate replacement.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>2. Replacement Request Process</h2>
            <p>To request a replacement, please contact our support team via WhatsApp (+91-7656072801) or email (turfdual@gmail.com) within 48 hours of delivery with your order ID, unboxing video/photos, and a description of the issue.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>3. Eligibility & Conditions</h2>
            <p>To be eligible for replacement, the product must be unused, unwashed, and in the same condition that you received it, with all original tags attached. Items damaged due to improper washing or misuse are not eligible for replacement.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
