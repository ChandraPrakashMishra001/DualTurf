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
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>2. Mandatory Unboxing Video for Claims</h2>
            <p>A continuous, uncut unboxing video starting from the sealed courier package is <strong>strictly mandatory</strong> for any replacement or defect claims. The outer shipping label and tracking number must be clearly visible in the video.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>3. Eligibility & Packaging Conditions</h2>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>All original brand tags, labels, and barcodes must be attached to the garment.</li>
              <li>The item must be returned with its original branded polybag and complete packaging.</li>
              <li>The jersey must be in unworn, unwashed, and undamaged condition.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>4. How to Request Replacement</h2>
            <p>Contact our support team via WhatsApp (+91-7656072801) or email (turfdual@gmail.com) within 48 hours of delivery with your Order ID and the unboxing video.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
