import Link from 'next/link';
import { getProductBySlug, getAllProducts } from '@/lib/sanity';
import { CATEGORIES } from '@/data/products';
import ProductClient from './ProductClient';

export const revalidate = 0;

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  const [product, allProducts] = await Promise.all([
    getProductBySlug(slug),
    getAllProducts()
  ]);

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '1rem' }}>
        <h2>Product not found.</h2>
        <Link href="/collections/all" className="btn-primary">Browse All Products</Link>
      </div>
    );
  }

  const category = CATEGORIES.find(c => c.slug === product.category) || { name: 'Collections', slug: 'all' };
  const relatedProducts = (allProducts || []).filter(p => p.slug !== product.slug).slice(0, 4);

  return (
    <ProductClient
      product={product}
      relatedProducts={relatedProducts}
      category={category}
    />
  );
}
