const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    instrumentationHook: true,
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only when SENTRY_AUTH_TOKEN is set
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Tunnel Sentry events to avoid ad-blockers
  tunnelRoute: '/monitoring',
})
