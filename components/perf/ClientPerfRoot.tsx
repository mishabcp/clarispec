'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, type MutableRefObject } from 'react'
import { useReportWebVitals } from 'next/web-vitals'

type WebVitalMetric = {
  name: string
  value: number
  id: string
  rating: string
  navigationType?: string
}

const FLUSH_MS = 12_000
const MAX_QUEUE = 40

type ClientPerfEvent = {
  source: 'client'
  kind: string
  name: string
  duration_ms: number
  path: string | null
  method: string | null
  status: number | null
  correlation_id: string | null
  meta: Record<string, unknown>
}

function enqueue(queueRef: MutableRefObject<ClientPerfEvent[]>, ev: ClientPerfEvent) {
  const q = queueRef.current
  q.push(ev)
  if (q.length > MAX_QUEUE) q.splice(0, q.length - MAX_QUEUE)
}

async function flushQueue(queueRef: MutableRefObject<ClientPerfEvent[]>) {
  const batch = queueRef.current.splice(0, queueRef.current.length)
  if (batch.length === 0) return
  try {
    await fetch('/api/perf/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    })
  } catch {
    queueRef.current.unshift(...batch)
  }
}

function vitalsToDuration(metric: WebVitalMetric): number {
  if (typeof metric.value === 'number' && Number.isFinite(metric.value)) return metric.value
  return 0
}

/**
 * Client-side navigation timing, Web Vitals, and fetch timing for same-origin /api calls.
 */
export function ClientPerfRoot() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queueRef = useRef<ClientPerfEvent[]>([])
  const prevPathRef = useRef<string | null>(null)
  const correlationRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : 'nav'
  )

  useReportWebVitals((metric: WebVitalMetric) => {
    enqueue(queueRef, {
      source: 'client',
      kind: 'web-vital',
      name: metric.name,
      duration_ms: vitalsToDuration(metric),
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      method: null,
      status: null,
      correlation_id: correlationRef.current,
      meta: {
        id: metric.id,
        rating: metric.rating,
        navigationType: metric.navigationType ?? '',
      },
    })
  })

  useEffect(() => {
    const fullPath = `${pathname ?? ''}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`
    const start = performance.now()
    const from = prevPathRef.current
    let cancelled = false

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return
        if (from !== null && from !== fullPath) {
          enqueue(queueRef, {
            source: 'client',
            kind: 'navigation',
            name: 'route-painted',
            duration_ms: Math.max(0, performance.now() - start),
            path: fullPath.slice(0, 500),
            method: null,
            status: null,
            correlation_id: correlationRef.current,
            meta: { from: from.slice(0, 500) },
          })
        }
        prevPathRef.current = fullPath
        correlationRef.current =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : correlationRef.current
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [pathname, searchParams])

  useEffect(() => {
    const origFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const t0 = performance.now()
      let urlStr = ''
      try {
        const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        urlStr = u
      } catch {
        urlStr = ''
      }
      let res: Response
      try {
        res = await origFetch(input, init)
      } catch (err) {
        const pathOnly = (() => {
          try {
            return new URL(urlStr, window.location.origin).pathname
          } catch {
            return urlStr.slice(0, 200)
          }
        })()
        if (pathOnly.startsWith('/api/')) {
          enqueue(queueRef, {
            source: 'client',
            kind: 'fetch',
            name: pathOnly.slice(0, 240),
            duration_ms: performance.now() - t0,
            path: pathOnly.slice(0, 500),
            method: (init?.method ?? 'GET').toString().slice(0, 16),
            status: null,
            correlation_id: correlationRef.current,
            meta: { networkError: true },
          })
        }
        throw err
      }

      try {
        const u = new URL(urlStr, window.location.origin)
        if (u.origin === window.location.origin && u.pathname.startsWith('/api/')) {
          enqueue(queueRef, {
            source: 'client',
            kind: 'fetch',
            name: u.pathname.slice(0, 240),
            duration_ms: performance.now() - t0,
            path: u.pathname.slice(0, 500),
            method: (init?.method ?? 'GET').toString().slice(0, 16),
            status: res.status,
            correlation_id: correlationRef.current,
            meta: {},
          })
        }
      } catch {
        /* ignore */
      }
      return res
    }

    const id = window.setInterval(() => {
      void flushQueue(queueRef)
    }, FLUSH_MS)

    const onHide = () => {
      void flushQueue(queueRef)
    }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      window.fetch = origFetch
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
      void flushQueue(queueRef)
    }
  }, [])

  return null
}
