'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllProducts } from '@/lib/sanity';
import styles from './page.module.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    getAllProducts().then(data => {
      if (data) setProductsList(data);
    });
  }, []);

  const searchResults = query.trim() === '' 
    ? [] 
    : productsList.filter(product => 
        (product.name && product.name.toLowerCase().includes(query.toLowerCase())) || 
        (product.team && product.team.toLowerCase().includes(query.toLowerCase()))
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
              <Link href={`/products/${product.slug}`} className={styles.imgWrapper}>
                <img src={product.image} alt={product.title || product.name} className={styles.img} />
              </Link>
              <div className={styles.meta}>
                <Link href={`/products/${product.slug}`}>
                  <h3 className={styles.productTitle}>{product.title || product.name}</h3>
                </Link>
                <p className={styles.price}>₹{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
