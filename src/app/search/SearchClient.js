'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const POPULAR_SEARCHES = [
  'Real Madrid',
  'FC Barcelona',
  'Arsenal',
  'Liverpool',
  'AC Milan',
  'Chelsea',
  'Bayern Munich',
  'Manchester United'
];

export default function SearchClient({ initialProducts = [] }) {
  const [query, setQuery] = useState('');

  const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const searchResults = query.trim() === '' 
    ? [] 
    : initialProducts.filter(product => {
        const title = (product.title || product.name || '').toLowerCase();
        const team = (product.team || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const type = (product.type || '').toLowerCase();
        const description = (product.description || '').toLowerCase();

        const fullText = `${title} ${team} ${category} ${type} ${description}`;

        // Return true if every word in the search query matches somewhere in fullText
        return searchTerms.every(term => fullText.includes(term));
      });

  return (
    <div className={styles.container}>
      <div className={styles.searchHeader}>
        <h1 className={styles.title}>Search Jerseys</h1>
        <div className={styles.inputWrapper}>
          <input 
            type="text" 
            placeholder="Search team, kit, club, e.g. Real Madrid, Arsenal..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Quick Suggestion Tags */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#888', alignSelf: 'center' }}>Popular:</span>
          {POPULAR_SEARCHES.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              style={{
                backgroundColor: query.toLowerCase() === tag.toLowerCase() ? 'var(--accent-color)' : '#1a1a1a',
                color: query.toLowerCase() === tag.toLowerCase() ? '#000000' : '#ffffff',
                border: '1px solid #333',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.results}>
        {query && (
          <p className={styles.resultsCount}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found for "{query}"
          </p>
        )}

        {query && searchResults.length === 0 && (
          <div className={styles.emptyState}>
            <h2>No jerseys found for "{query}"</h2>
            <p>Try searching for team names like Real Madrid, FC Barcelona, Arsenal, or Liverpool.</p>
          </div>
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
