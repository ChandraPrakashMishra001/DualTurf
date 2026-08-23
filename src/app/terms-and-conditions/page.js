export const metadata = {
  title: 'Terms & Conditions - DualTurf',
  description: 'Terms and Conditions for purchasing and using DualTurf website and services.',
}

export default function TermsAndConditions() {
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', color: 'var(--text-light)' }}>
        <h1 className="font-display title-underline" style={{ marginBottom: '1.5rem', color: '#c4ff3d', fontSize: '2.5rem' }}>
          Terms & Conditions
        </h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Last updated: August 2026</p>

        {/* Highlighted Core Policy Card */}
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid rgba(196, 255, 61, 0.3)',
          borderRadius: '12px',
          padding: '1.75rem',
          marginBottom: '2.5rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
        }}>
          <h2 style={{ color: '#c4ff3d', fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 800 }}>
            ⚡ KEY STORE TERMS
          </h2>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#ffffff', fontWeight: '500', lineHeight: '1.6' }}>
            <li><strong>No cancellation after dispatch:</strong> Once your parcel is handed over to the courier partner, cancellations will not be entertained.</li>
            <li><strong>Exchange only for wrong size and products sent by us:</strong> If you receive a different size or item from what was confirmed in your order, we will replace it with the correct product.</li>
            <li><strong>Refund / Replacement only for manufacturing defects:</strong> Claims are accepted solely for verified defects present at the time of delivery.</li>
            <li><strong>Unboxing video mandatory for claims:</strong> A complete, uncut 360° unboxing video starting from the sealed courier package is strictly required for all claim verifications.</li>
            <li><strong>Tags being attached to the packing is mandatory:</strong> All product tags, labels, and barcodes must be intact and attached to the garment.</li>
            <li><strong>Original package must be provided:</strong> The jersey must be sent back with its original brand polybag and complete packaging for any approved refund or replacement.</li>
          </ol>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.7' }}>
          
          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>1. Order Cancellation & Dispatch Policy</h2>
            <p>You may request cancellation within 24 hours of placing your order, provided it has not yet been processed or dispatched. Once your order has been dispatched from our facility in Bhubaneswar, cancellations are strictly not accepted under any circumstances. Customers are requested to verify their cart and delivery details carefully before completing checkout.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>2. Size Exchanges & Wrong Product Claims</h2>
            <p>Exchanges are applicable <strong>only</strong> in the event that DualTurf delivers a size or jersey variant different from the size selected in your order confirmation invoice. Please refer to our size chart before ordering. If the wrong item or size was dispatched by us, we will arrange for a replacement at zero additional shipping charge upon verification.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>3. Manufacturing Defects & Refund Eligibility</h2>
            <p>Refunds or replacements are entertained strictly for genuine manufacturing defects (such as torn fabrics, stitching issues, or misprinted crests) present at the time of unboxing. Normal wear-and-tear, size misunderstandings, or damage resulting from improper machine washing and hot ironing will not qualify for refunds or replacements.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>4. Mandatory Unboxing Video Requirement</h2>
            <p>To safeguard both our customers and our store against transit discrepancies, a <strong>clear, continuous, and uncut unboxing video</strong> is mandatory. The video must show:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>The outer shipping label and tracking number clearly visible.</li>
              <li>The unopened, intact courier bag prior to cutting or unsealing.</li>
              <li>The full removal and inspection of the jersey and its tags in one single recording.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>Claims submitted without a valid unboxing video cannot be processed.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>5. Product Tags & Packaging Condition</h2>
            <p>For any authorized replacement or return verification, the garment must be in its original pristine condition — unworn, unwashed, odor-free, and with all original brand tags firmly attached. The original branded polybag and packaging must be preserved and provided.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>6. Pricing, Payments & Partial COD Policy</h2>
            <p>All prices listed on DualTurf are in Indian Rupees (INR). We operate on a <strong>Partial Cash on Delivery (Partial COD)</strong> and Full Online Payment model. Pure zero-advance COD is not offered.</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong>Standard Orders:</strong> We require a nominal advance payment of ₹199 online to confirm the booking and initiate dispatch. The remaining balance is collected in cash/UPI upon delivery.</li>
              <li><strong>Customized Jersey Orders:</strong> Customized kits require an advance payment of ₹399 online (₹199 booking advance + ₹200 custom printing fee). The remaining balance is collected upon delivery. Delivery timeline is extended by 3–5 business days for precision player printing.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.35rem' }}>7. Contact & Support</h2>
            <p>For any questions regarding these Terms & Conditions or to report an issue with your delivery, please reach out to our team:</p>
            <div style={{ marginTop: '0.75rem', padding: '1rem', backgroundColor: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p>• <strong>Email:</strong> <a href="mailto:turfdual@gmail.com" style={{ color: '#c4ff3d' }}>turfdual@gmail.com</a></p>
              <p>• <strong>WhatsApp / Phone:</strong> <a href="tel:+917656072801" style={{ color: '#c4ff3d' }}>+91-7656072801</a></p>
              <p>• <strong>Address:</strong> Maruti Vihar, Raghunathpur Jali, Bhubaneswar, Odisha, India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
