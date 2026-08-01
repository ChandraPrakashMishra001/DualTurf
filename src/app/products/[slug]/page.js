'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProductBySlug, getAllProducts } from '@/lib/sanity';
import { CATEGORIES } from '@/data/products';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [openAccordion, setOpenAccordion] = useState('shipping');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (rawSlug) {
      setLoading(true);
      Promise.all([
        getProductBySlug(rawSlug),
        getAllProducts()
      ]).then(([prodData, allData]) => {
        setProduct(prodData);
        setAllProducts(allData || []);
        if (prodData?.image) {
          setSelectedImg(prodData.image);
        }
        if (prodData?.sizes && prodData.sizes.length > 0) {
          setSelectedSize(prodData.sizes[0]);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Error loading product:", err);
        setLoading(false);
      });
    }
  }, [rawSlug]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '1rem' }}>
        <h2>Product not found.</h2>
        <Link href="/collections/all" className="btn-primary">Browse All Products</Link>
      </div>
    );
  }

  // Category for breadcrumb
  const category = CATEGORIES.find(c => c.slug === product.category) || { name: 'Collections', slug: 'all' };

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, 1);
    setToastMsg(`Added ${product.title || product.name} (Size: ${selectedSize}) to bag!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const relatedProducts = allProducts.filter(p => p.slug !== product.slug).slice(0, 4);
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
          
          <div className={styles.priceContainer}>
            <span className={styles.price}>₹{product.price}</span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>₹{product.originalPrice}</span>
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

          <button className="btn-primary" style={{ width: '100%', height: '52px', marginTop: '1rem' }} onClick={handleAddToCart}>
            ADD TO BAG
          </button>

          <ul className={styles.features}>
            <li>100% recycled polyester with Dri-FIT technology</li>
            <li>Official club detailing & high-density crest</li>
            <li>Machine wash cold inside-out</li>
            <li>{product.type || 'Stadium / Regular athletic fit'}</li>
            <li>Dispatched within 48 hrs from Mumbai</li>
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
                  <p>• Delivery time: 5-7 business days.</p>
                  <p>• Free shipping on orders above ₹999.</p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button 
                className={styles.accordionHeader} 
                onClick={() => toggleAccordion('return')}
              >
                Return Information
                <span>{openAccordion === 'return' ? '-' : '+'}</span>
              </button>
              {openAccordion === 'return' && (
                <div className={styles.accordionContent}>
                  <p>• 5-day size exchange guarantee.</p>
                  <p>• No hassle returns for manufacturing defects.</p>
                  <p>• Custom printed items non-refundable.</p>
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
