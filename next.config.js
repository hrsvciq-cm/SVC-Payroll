/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure Prisma Client is generated during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Prisma from webpack bundling
      config.externals.push('@prisma/client')
    }
    return config
  },
  // Environment variables that should be available at build time
  env: {
    // These will be available in both server and client
  },
}

module.exports = nextConfig

