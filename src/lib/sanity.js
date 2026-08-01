import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'a1ui8xji',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  // No token needed — storefront only reads published products (public access)
})

// Image URL builder
const builder = createImageUrlBuilder(client)
export function urlFor(source) {
  return builder.image(source)
}

// ─── Product Queries ───────────────────────────────────────

// Fetch all products
export async function getAllProducts() {
  return client.fetch(`
    *[_type == "product" && inStock != false] | order(_createdAt desc) {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      type,
      sleeve,
      featured,
      description,
      sizes,
      "image": images[0].asset->url,
      "images": images[].asset->url,
    }
  `)
}

// Fetch a single product by slug
export async function getProductBySlug(slug) {
  return client.fetch(`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      type,
      sleeve,
      featured,
      description,
      sizes,
      "image": images[0].asset->url,
      "images": images[].asset->url,
    }
  `, { slug })
}

// Fetch products by category
export async function getProductsByCategory(category) {
  return client.fetch(`
    *[_type == "product" && category == $category && inStock != false] | order(_createdAt desc) {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      type,
      sleeve,
      featured,
      description,
      sizes,
      "image": images[0].asset->url,
    }
  `, { category })
}

// Fetch featured products (for homepage Latest Drop section)
export async function getFeaturedProducts() {
  return client.fetch(`
    *[_type == "product" && featured == true && inStock != false] | order(_createdAt desc)[0...8] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      "image": images[0].asset->url,
    }
  `)
}

// Search products by name or team
export async function searchProducts(query) {
  return client.fetch(`
    *[_type == "product" && (name match $query || team match $query) && inStock != false] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      "image": images[0].asset->url,
    }
  `, { query: `*${query}*` })
}
