import { getAllProducts } from '@/lib/sanity';
import SearchClient from './SearchClient';

export const revalidate = 0;

export default async function SearchPage() {
  const allProducts = await getAllProducts();
  return <SearchClient initialProducts={allProducts || []} />;
}
