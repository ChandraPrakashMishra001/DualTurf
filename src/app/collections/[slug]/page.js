import { getProductsByCategory, getAllProducts } from '@/lib/sanity';
import { CATEGORIES } from '@/data/products';
import CollectionClient from './CollectionClient';

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
    <CollectionClient
      initialProducts={displayProducts}
      categories={CATEGORIES}
      currentSlug={slug}
      title={title}
      isFallback={isFallback}
    />
  );
}
