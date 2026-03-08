/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prefer production optimizations
  poweredByHeader: false,
  compress: true,
  // Ensure Prisma Client is generated during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  env: {},
}

module.exports = nextConfig

