import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
