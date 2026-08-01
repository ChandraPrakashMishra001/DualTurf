import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/sanity';

export const revalidate = 0;

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ success: true, products: products || [] });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ success: false, products: [] }, { status: 500 });
  }
}
