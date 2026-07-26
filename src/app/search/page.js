'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products } from '@/data/products';
import styles from './page.module.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  
  const searchResults = query.trim() === '' 
    ? [] 
    : products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) || 
        product.team.toLowerCase().includes(query.toLowerCase())
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

        {query && searchResults.length === 0 && (
          <div className={styles.emptyState}>
            <h2>No results found</h2>
            <p>Try checking your spelling or use more general terms</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className={styles.grid}>
            {searchResults.map(product => (
              <Link href={`/products/${product.slug}`} key={product.id} className={styles.card}>
                <div className={styles.imageWrapper} style={{ background: product.gradient }}>
                  {product.originalPrice && <span className={styles.saleBadge}>Sale</span>}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.priceContainer}>
                    {product.originalPrice ? (
                      <>
                        <span className={styles.price}>₹{product.price}</span>
                        <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                      </>
                    ) : (
                      <span className={styles.price}>₹{product.price}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
