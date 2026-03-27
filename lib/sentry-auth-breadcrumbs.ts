import * as Sentry from '@sentry/nextjs'

const CATEGORY = 'auth.login'
const SHELL_CATEGORY = 'auth.shell'

/** Mount / lifecycle on auth layout (runs before LoginForm hydrates). */
export function authShellBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: SHELL_CATEGORY,
    message,
    level: 'info',
    data: data ?? {},
  })
}

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
