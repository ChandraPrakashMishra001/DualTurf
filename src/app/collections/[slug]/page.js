import Link from 'next/link';
import { getProductsByCategory, getAllProducts } from '@/lib/sanity';
import { CATEGORIES } from '@/data/products';
import styles from './page.module.css';

export const revalidate = 0;

export default async function CollectionPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'all';

  // Find category name or default to slug
  const category = CATEGORIES.find(c => c.slug === slug || c.id === slug);
  const title = category ? category.name : (slug === 'all' ? 'ALL PRODUCTS' : slug.replace(/-/g, ' ').toUpperCase());

  // Fetch all products first
  const allProducts = await getAllProducts();

  // Filter or query category products
  const categoryProducts = slug === 'all'
    ? allProducts
    : await getProductsByCategory(slug);

  // If a specific category has no products uploaded yet, fallback to allProducts so products never vanish
  const displayProducts = (categoryProducts && categoryProducts.length > 0)
    ? categoryProducts
    : allProducts;

  const isFallback = slug !== 'all' && (!categoryProducts || categoryProducts.length === 0);

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/collections/all">Collections</Link>
        <span>/</span>
        <span className={styles.currentBreadcrumb}>{title}</span>
      </div>

      <div className={styles.header}>
        <h1 className="font-display title-underline">{title}</h1>
        {isFallback && (
          <p style={{ color: 'var(--accent-color)', marginTop: '1rem', fontSize: '0.9375rem' }}>
            Showing all available jerseys below:
          </p>
        )}
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Category</h3>
            <ul className={styles.filterList}>
              <li>
                <Link 
                  href="/collections/all"
                  className={slug === 'all' ? styles.activeFilter : ''}
                >
                  ALL PRODUCTS
                </Link>
              </li>
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={`/collections/${cat.slug}`}
                    className={cat.slug === slug ? styles.activeFilter : ''}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Type</h3>
            <ul className={styles.filterList}>
              <li><label><input type="checkbox" /> Stadium/Fan Version</label></li>
            </ul>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Sleeve</h3>
            <ul className={styles.filterList}>
              <li><label><input type="checkbox" /> Half Sleeves</label></li>
              <li><label><input type="checkbox" /> Full Sleeves</label></li>
              <li><label><input type="checkbox" /> Sleeveless</label></li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.toolbar}>
            <span className={styles.productCount}>{displayProducts.length} products available</span>
            <div className={styles.sort}>
              <label htmlFor="sort">Sort by:</label>
              <select id="sort" className={styles.sortSelect}>
                <option>Featured</option>
                <option>Best selling</option>
                <option>Price, low to high</option>
                <option>Price, high to low</option>
                <option>Date, old to new</option>
                <option>Date, new to old</option>
              </select>
            </div>
          </div>

          <div className={styles.grid}>
            {displayProducts.map(product => (
              <div key={product.id || product._id} className={`product-card ${styles.card}`}>
                <Link href={`/products/${product.slug}`} className={styles.imageWrapper}>
                  <img src={product.image} alt={product.title || product.name} className="product-card-img" />
                  {product.originalPrice && <span className={styles.saleBadge}>SALE</span>}
                </Link>
                <div className={styles.info}>
                  <Link href={`/products/${product.slug}`}>
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
        </main>
      </div>
    </div>
  );
}
