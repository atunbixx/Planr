/** @type {import('next').NextConfig} */
const nextConfig = {
  // No experimental features needed for Clerk
  // No webpack overrides needed
  
  // Optional: Image domains if using next/image with external images
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  
  // Keep TypeScript and ESLint strict (good practice)
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
}

module.exports = nextConfig