import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  pageExtensions: ['tsx', 'mdx'],
  productionBrowserSourceMaps: false,
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3111',
  },
}

export default nextConfig
