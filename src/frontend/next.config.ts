import type { NextConfig } from 'next'

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',

})

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

export default  process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig)
