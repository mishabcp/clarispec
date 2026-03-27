'use client'

import type { AppLogLevel } from '@/lib/app-log-ingest'

function releaseTag(): string | undefined {
  return process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
}

/**
 * Sends a row to public.app_logs via POST /api/logs (never include passwords/tokens).
 * Also mirrors to console in development.
 */
export function appLogClient(
  level: AppLogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : console.info
    fn.call(console, '[app-log]', message, context ?? {})
  }

  if (typeof window === 'undefined') return

  void fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'client',
      level,
      message,
      context: context ?? {},
      path: window.location.pathname,
      release: releaseTag(),
    }),
    keepalive: true,
  }).catch(() => {})
}

