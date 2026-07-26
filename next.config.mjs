/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats (WebP/AVIF) automatically — massively reduces image size
    formats: ['image/avif', 'image/webp'],
    // Allow local images from /public
    localPatterns: [
      { pathname: '/images/**' }
    ],
    // Increase quality-to-size sweet spot
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}

export default nextConfig
