/**
 * RSC Flight client sometimes reports unhandled "Connection closed." when the
 * stream ends early (tab close, preview bots, navigation). We tag every match
 * and drop high-confidence noise so Sentry stays actionable.
 *
 * Vercel (server-side check): Dashboard → project → Logs → filter time + path
 * `/login` → see status/duration vs client "canceled" in DevTools Network.
 */

type MinimalEvent = {
  exception?: {
    values?: Array<{
      value?: string
      mechanism?: { type?: string }
      stacktrace?: {
        frames?: Array<{
          filename?: string
          abs_path?: string
          module?: string
        }>
      }
    }>
  }
  transaction?: string
  request?: {
    url?: string
    headers?: Record<string, string> | Array<[string, string]>
  }
  tags?: Record<string, unknown>
}

function frameBlob(f: {
  filename?: string
  abs_path?: string
  module?: string
}): string {
  return [f.filename, f.abs_path, f.module].filter(Boolean).join(' ')
}

/**
 * Must match before symbolication: the browser often sends chunk names like
 * `8105-….js`, not `react-server-dom-webpack-client…` (that appears after ingest).
 */
function isFlightConnectionClosed(event: MinimalEvent): boolean {
  const ex = event.exception?.values?.[0]
  if (ex?.value !== 'Connection closed.') return false

  const frames = ex.stacktrace?.frames ?? []
  for (const f of frames) {
    const blob = frameBlob(f)
    if (blob.includes('react-server-dom-webpack-client')) return true
    if (blob.includes('react-server-dom')) return true
  }

  const mech = ex.mechanism?.type
  const onLogin =
    event.transaction === '/login' ||
    (typeof event.tags?.url === 'string' && event.tags.url.includes('/login'))

  if (
    mech === 'auto.browser.global_handlers.onunhandledrejection' &&
    onLogin &&
    frames.length > 0
  ) {
    return true
  }

  return false
}

function headerUserAgent(event: MinimalEvent): string | undefined {
  const h = event.request?.headers
  if (!h) return undefined
  if (Array.isArray(h)) {
    const row = h.find(([k]) => k.toLowerCase() === 'user-agent')
    return row?.[1]
  }
  return h['User-Agent'] ?? h['user-agent']
}

function eventUrlHostname(event: MinimalEvent): string | null {
  const url = event.request?.url ?? event.tags?.url
  if (!url || typeof url !== 'string') return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function productionHostname(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SENTRY_PRODUCTION_HOST?.trim()
  if (explicit) return explicit
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!app) return null
  try {
    return new URL(app).hostname
  } catch {
    return null
  }
}

function browserTagLooksHeadless(event: MinimalEvent): boolean {
  const b = event.tags?.browser
  return typeof b === 'string' && /headless/i.test(b)
}

/** Client beforeSend: tag all; drop Headless + preview *.vercel.app when prod host known. */
export function beforeSendFlightConnectionClosed(
  event: MinimalEvent
): MinimalEvent | null {
  if (!isFlightConnectionClosed(event)) return event as MinimalEvent

  event.tags = {
    ...event.tags,
    flight_stream: 'connection_closed',
  }

  if (process.env.NEXT_PUBLIC_SENTRY_KEEP_ALL_FLIGHT_ERRORS === 'true') {
    return event as MinimalEvent
  }

  const ua = headerUserAgent(event) ?? ''
  if (/headless/i.test(ua) || browserTagLooksHeadless(event)) {
    return null
  }

  const host = eventUrlHostname(event)
  const prod = productionHostname()
  if (prod && host && host.endsWith('.vercel.app') && host !== prod) {
    return null
  }

  return event as MinimalEvent
}
