'use client'

import { useEffect } from 'react'

function serializeUnknown(reason: unknown): Record<string, unknown> {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
      cause: reason.cause !== undefined ? String(reason.cause) : undefined,
    }
  }
  if (reason && typeof reason === 'object') {
    try {
      return JSON.parse(JSON.stringify(reason)) as Record<string, unknown>
    } catch {
      return { fallback: String(reason) }
    }
  }
  return { value: String(reason) }
}

/**
 * Logs uncaught errors and unhandled promise rejections with context.
 * Enable in production: set NEXT_PUBLIC_CLIENT_ERROR_LOGS=true (Vercel env).
 * Always active in development.
 */
export function ClientErrorLogger() {
  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_CLIENT_ERROR_LOGS === 'true'

    if (!enabled) return

    const tag = '[Clarispec client errors]'

    function onWindowError(event: ErrorEvent) {
      const payload = {
        type: 'window.error' as const,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error instanceof Error
          ? {
              name: event.error.name,
              message: event.error.message,
              stack: event.error.stack,
            }
          : event.error !== undefined
            ? serializeUnknown(event.error)
            : undefined,
        time: new Date().toISOString(),
        href: typeof window !== 'undefined' ? window.location.href : '',
      }
      console.error(tag, payload)
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const payload = {
        type: 'unhandledrejection' as const,
        reason: serializeUnknown(event.reason),
        time: new Date().toISOString(),
        href: typeof window !== 'undefined' ? window.location.href : '',
      }
      console.error(tag, payload)
    }

    console.info(tag, 'Listening for window.error and unhandledrejection')
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
