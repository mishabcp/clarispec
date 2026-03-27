'use client'

import { useEffect } from 'react'

/**
 * `Error("Connection closed.")` is thrown by React’s **Flight / RSC client** when the
 * streaming connection ends while the response is not in partial-stream mode: it calls
 * `reportGlobalError(weakResponse, new Error("Connection closed."))`.
 *
 * Upstream source (React): `packages/react-client/src/ReactFlightClient.js` → `export function close`
 * (the `else` branch; the `if (response._allowPartialStream)` branch halts chunks instead).
 *
 * Next.js ships it inside compiled runtimes, e.g.
 * `node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js` (minified; search for `Connection closed.`).
 */
function isReactFlightConnectionClosedError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false
  const m = reason.message.trim()
  return m === 'Connection closed.' || m === 'Connection closed'
}

function collectFlightStreamCloseDiagnostics(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}

  const nav = performance.getEntriesByType?.('navigation')?.[0] as
    | PerformanceNavigationTiming
    | undefined

  const mem = (
    performance as Performance & {
      memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number }
    }
  ).memory

  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number }
    }
  ).connection

  return {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search || null,
    referrer: document.referrer || null,
    readyState: document.readyState,
    visibilityState: document.visibilityState,
    hidden: document.hidden,
    prerendering: (document as Document & { prerendering?: boolean }).prerendering ?? false,
    onLine: navigator.onLine,
    navigationType: nav?.type ?? null,
    redirectCount: nav?.redirectCount ?? null,
    domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
    loadEventEnd: nav?.loadEventEnd ?? null,
    performanceNowMs: Math.round(performance.now()),
    connection: conn
      ? {
          effectiveType: conn.effectiveType ?? null,
          downlink: conn.downlink ?? null,
          rtt: conn.rtt ?? null,
        }
      : null,
    memory: mem
      ? {
          usedJSHeapSize: mem.usedJSHeapSize ?? null,
          totalJSHeapSize: mem.totalJSHeapSize ?? null,
        }
      : null,
  }
}

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
 * Extra RSC/Flight "Connection closed" diagnostics: NEXT_PUBLIC_FLIGHT_CONNECTION_DEBUG=true
 * (or enable client error logs / run in development).
 * Always active in development.
 */
export function ClientErrorLogger() {
  useEffect(() => {
    const clientLogs =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_CLIENT_ERROR_LOGS === 'true'

    const flightDebugOnly =
      process.env.NEXT_PUBLIC_FLIGHT_CONNECTION_DEBUG === 'true'

    if (!clientLogs && !flightDebugOnly) return

    const tag = '[Clarispec client errors]'
    const flightTag = '[Clarispec RSC/Flight connection closed]'

    function logFlightConnectionClosed(rejectionEvent: PromiseRejectionEvent) {
      console.warn(flightTag, {
        hint: 'Thrown from React Flight close() → reportGlobalError (see comment at top of ClientErrorLogger.tsx)',
        time: new Date().toISOString(),
        reason: serializeUnknown(rejectionEvent.reason),
        diagnostics: collectFlightStreamCloseDiagnostics(),
      })
    }

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
      const flightClose = isReactFlightConnectionClosedError(event.reason)

      if (flightDebugOnly && !clientLogs) {
        if (flightClose) logFlightConnectionClosed(event)
        return
      }

      if (!clientLogs) return

      const payload: Record<string, unknown> = {
        type: 'unhandledrejection',
        reason: serializeUnknown(event.reason),
        time: new Date().toISOString(),
        href: typeof window !== 'undefined' ? window.location.href : '',
      }
      if (flightClose) {
        payload.flightSource =
          'React FlightClient.close() → reportGlobalError(Error("Connection closed."))'
        payload.flightDiagnostics = collectFlightStreamCloseDiagnostics()
      }
      console.error(tag, payload)
    }

    if (clientLogs) {
      window.addEventListener('error', onWindowError)
      console.info(tag, 'Listening for window.error and unhandledrejection')
    }
    if (clientLogs || flightDebugOnly) {
      window.addEventListener('unhandledrejection', onUnhandledRejection)
      if (flightDebugOnly && !clientLogs) {
        console.info(
          flightTag,
          'Listening for unhandledrejection (React Flight Connection closed only)'
        )
      }
    }

    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
