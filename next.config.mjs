import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
// NODE_ENV can be "production" while `next dev` runs (e.g. env overrides). Use the actual CLI
// invocation so React Refresh / webpack dev never get script-src 'self' only.
const isNextDev =
  process.argv[2] === 'dev' || process.env.npm_lifecycle_event === 'dev'
const strictScriptSrc = process.env.NODE_ENV === 'production' && !isNextDev
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `script-src 'self'${strictScriptSrc ? '' : " 'unsafe-eval' 'unsafe-inline'"}`,
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://generativelanguage.googleapis.com https://*.sentry.io",
  "object-src 'none'",
].join('; ')

const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

/** Source map / release upload only runs with a token; keep logs quiet otherwise. */
const sentryUploadConfigured = Boolean(process.env.SENTRY_AUTH_TOKEN)

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // No token: suppress "Will not upload source maps" spam. With token + CI: show upload progress.
  silent: !sentryUploadConfigured || !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
})
