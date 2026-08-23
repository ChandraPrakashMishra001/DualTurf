import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

const productSchema = {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Title / Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'price',
      title: 'Price (?)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    },
    {
      name: 'originalPrice',
      title: 'Original / MRP Price (?)',
      type: 'number',
    },
    {
      name: 'team',
      title: 'Team / Club',
      type: 'string',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Club Kits', value: 'club' },
          { title: 'International Kits', value: 'international' },
          { title: 'Retro Classics', value: 'retro' },
          { title: 'Fan Version', value: 'fan' },
          { title: 'Player Version', value: 'player' },
          { title: 'Special Edition', value: 'special' },
        ],
      },
    },
    {
      name: 'images',
      title: 'Kit Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'sizes',
      title: 'Available Sizes',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'S', value: 'S' },
          { title: 'M', value: 'M' },
          { title: 'L', value: 'L' },
          { title: 'XL', value: 'XL' },
          { title: 'XXL', value: 'XXL' },
        ],
      },
      initialValue: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      name: 'type',
      title: 'Version Type',
      type: 'string',
      options: {
        list: [
          { title: 'Fan Version (Regular)', value: 'fan' },
          { title: 'Player Version (Slim Fit)', value: 'player' },
          { title: 'Master Copy', value: 'master' },
        ],
      },
      initialValue: 'fan',
    },
    {
      name: 'sleeve',
      title: 'Sleeve Length',
      type: 'string',
      options: {
        list: [
          { title: 'Short Sleeve', value: 'short' },
          { title: 'Full Sleeve', value: 'full' },
        ],
      },
      initialValue: 'short',
    },
    {
      name: 'featured',
      title: 'Feature on Homepage (Latest Drops)',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'description',
      title: 'Product Description',
      type: 'text',
      rows: 4,
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'team',
      media: 'images.0',
    },
  },
}

export default defineConfig({
  name: 'default',
  title: 'DualTurf Store Manager',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'a1ui8xji',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',

  plugins: [structureTool()],

  schema: {
    types: [productSchema],
  },
})
