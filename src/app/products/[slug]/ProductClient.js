'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function ProductClient({ product, relatedProducts, category }) {
  const { addToCart } = useCart();
  const [selectedImg, setSelectedImg] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M'
  );
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [openAccordion, setOpenAccordion] = useState('shipping');
  const [toastMsg, setToastMsg] = useState(null);

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const handleAddToCart = () => {
    const customization = {
      customName: customName.trim().toUpperCase(),
      customNumber: customNumber.trim(),
    };
    addToCart(product, selectedSize, 1, customization);
    
    let toast = `Added ${product.title || product.name} (Size: ${selectedSize}) to bag!`;
    if (customization.customName || customization.customNumber) {
      const printInfo = [
        customization.customName,
        customization.customNumber ? `#${customization.customNumber}` : ''
      ].filter(Boolean).join(' ');
      toast = `Added ${product.title || product.name} (${selectedSize} • ${printInfo}) to bag!`;
    }
    setToastMsg(toast);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const hasCustomization = Boolean(customName.trim() || customNumber.trim());
  const currentPrice = (Number(product.price) || 0) + (hasCustomization ? 200 : 0);

  const imageList = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
  const displayMainImg = selectedImg || product.image;
  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className={styles.container}>
      {toastMsg && (
        <div className={styles.toast}>
          <span>✓ {toastMsg}</span>
        </div>
      )}

      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/collections/${category.slug}`}>{category.name}</Link>
        <span>/</span>
        <span className={styles.currentBreadcrumb}>{product.title || product.name}</span>
      </div>

      <div className={styles.productLayout}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            <img src={displayMainImg} alt={product.title || product.name} className={styles.mainImg} />
            {product.originalPrice && <span className={styles.saleBadge}>SALE</span>}
          </div>
          {imageList.length > 1 && (
            <div className={styles.thumbnailRow}>
              {imageList.map((img, i) => (
                <div
                  key={i}
                  className={`${styles.thumbnail} ${img === displayMainImg ? styles.activeThumbnail : ''}`}
                  onClick={() => setSelectedImg(img)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={img} alt={`thumbnail ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.productInfo}>
          <h1 className={styles.productName}>{product.title || product.name}</h1>
          
          <div className={styles.priceContainer} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <span className={styles.price}>₹{currentPrice}</span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>₹{Number(product.originalPrice) + (hasCustomization ? 200 : 0)}</span>
            )}
            {hasCustomization && (
              <span style={{ fontSize: '0.8125rem', color: '#c4ff3d', fontWeight: 700, backgroundColor: 'rgba(196, 255, 61, 0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(196, 255, 61, 0.3)' }}>
                +₹200 Custom Player Print
              </span>
            )}
          </div>

          {product.description && (
            <p className={styles.descriptionText} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.6', margin: '1rem 0' }}>
              {product.description}
            </p>
          )}

          <div className={styles.sizeSection}>
            <div className={styles.sizeHeader}>
              <span className={styles.sizeLabel}>Size: <strong>{selectedSize}</strong></span>
              <button className={styles.sizeGuideBtn}>Size Guide 📐</button>
            </div>
            <div className={styles.sizeGrid}>
              {availableSizes.map(size => (
                <button 
                  key={size}
                  className={`${styles.sizeBtn} ${selectedSize === size ? styles.selectedSize : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Jersey Customization / Player Print */}
          <div className={styles.customizationSection}>
            <div className={styles.customizationHeader}>
              <span className={styles.customizationTitle}>⚡ CUSTOMIZE JERSEY PRINT (+₹200)</span>
            </div>

            <div className={styles.customNoticeBox}>
              <span>⚠️ Note: Customization charges are ₹200. Delivery time will get extended by 3–5 days for custom printing. Only official football player names are accepted (random names will result in order cancellation and refund).</span>
            </div>

            <div className={styles.customInputRow}>
              <div className={styles.customInputGroup}>
                <label>PLAYER NAME</label>
                <input
                  type="text"
                  placeholder="e.g. BELLINGHAM, MESSI, RONALDO"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                  maxLength={25}
                  className={styles.customInput}
                />
              </div>

              <div className={styles.customInputGroup} style={{ maxWidth: '130px' }}>
                <label>NUMBER</label>
                <input
                  type="text"
                  placeholder="e.g. 5, 7, 10"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  maxLength={3}
                  className={styles.customInput}
                />
              </div>
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', height: '52px', marginTop: '0.5rem' }} onClick={handleAddToCart}>
            ADD TO BAG • ₹{currentPrice}
          </button>

          <ul className={styles.features}>
            <li>100% recycled polyester with Dri-FIT technology</li>
            <li>Official club detailing & high-density crest</li>
            <li>Machine wash cold inside-out</li>
            <li>{product.type || 'Stadium / Regular athletic fit'}</li>
            <li>Dispatched within 48 hrs from Bhubaneswar, Odisha</li>
          </ul>

          <div className={styles.accordionGroup}>
            <div className={styles.accordionItem}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleAccordion('shipping')}
              >
                Shipping Information
                <span>{openAccordion === 'shipping' ? '-' : '+'}</span>
              </button>
              {openAccordion === 'shipping' && (
                <div className={styles.accordionContent}>
                  <p>• Dispatched within 48 hours across India.</p>
                  <p>• Standard Delivery: 5–7 business days.</p>
                  <p>• Customized Jersey Delivery: Extended by 3–5 days for precision heat-press printing.</p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleAccordion('return')}
              >
                Replacement Policy
                <span>{openAccordion === 'return' ? '-' : '+'}</span>
              </button>
              {openAccordion === 'return' && (
                <div className={styles.accordionContent}>
                  <p>• Replacement when we send the wrong size.</p>
                  <p>• Replacement only on manufacturing defects.</p>
                  <p>• No returns or refunds provided (replacement only).</p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleAccordion('support')}
              >
                Customer Support
                <span>{openAccordion === 'support' ? '-' : '+'}</span>
              </button>
              {openAccordion === 'support' && (
                <div className={styles.accordionContent}>
                  <p>• Email: turfdual@gmail.com</p>
                  <p>• Phone / WhatsApp: +91-7656072801</p>
                  <p>• Support Hours: Mon–Sat, 10 AM–6 PM IST</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className={styles.relatedSection}>
          <h2 className="font-display title-underline" style={{ fontSize: '3rem', marginBottom: '2.5rem' }}>
            PAIRS WELL WITH
          </h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map(related => (
              <div key={related.id} className={`product-card ${styles.relatedCard}`}>
                <Link href={`/products/${related.slug}`} className={styles.relatedImage}>
                  <img src={related.image} alt={related.title || related.name} className="product-card-img" />
                </Link>
                <div className={styles.relatedMeta}>
                  <Link href={`/products/${related.slug}`}>
                    <h3 className={styles.relatedName}>{related.title || related.name}</h3>
                  </Link>
                  <span className={styles.relatedPrice}>₹{related.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
