import * as Sentry from '@sentry/nextjs'

const CATEGORY = 'auth.login'

/** PII-safe breadcrumbs for /login debugging (attached to Sentry errors). */
export function loginBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: CATEGORY,
    message,
    level: 'info',
    data: data ?? {},
  })
}
