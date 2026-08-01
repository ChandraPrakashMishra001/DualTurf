'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function SearchClient({ initialProducts = [] }) {
  const [query, setQuery] = useState('');

  const searchResults = query.trim() === '' 
    ? [] 
    : initialProducts.filter(product => 
        (product.name && product.name.toLowerCase().includes(query.toLowerCase())) || 
        (product.team && product.team.toLowerCase().includes(query.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(query.toLowerCase()))
      );

  return (
    <div className={styles.container}>
      <div className={styles.searchHeader}>
        <h1 className={styles.title}>Search</h1>
        <div className={styles.inputWrapper}>
          <input 
            type="text" 
            placeholder="Search products, teams..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className={styles.results}>
        {query && (
          <p className={styles.resultsCount}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
          </p>
        )}

        <div className={styles.grid}>
          {searchResults.map(product => (
            <div key={product.id || product._id} className={styles.card}>
              <Link href={`/products/${product.slug}`} className={styles.imageWrapper}>
                <img src={product.image} alt={product.title || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                {product.originalPrice && <span className={styles.saleBadge}>SALE</span>}
              </Link>
              <div className={styles.info}>
                <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: '#fff' }}>
                  <h3 className={styles.productName}>{product.title || product.name}</h3>
                </Link>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>₹{product.price}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
