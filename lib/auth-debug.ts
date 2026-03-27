/**
 * Auth debugging (browser only).
 *
 * ## Logs that survive redirect (no "Preserve log" required)
 * 1. Open `/login?authTrace=1` (or `/signup?authTrace=1`) — records a step-by-step trace
 *    in sessionStorage and prints it on the next route change (see AuthTraceSink in root layout).
 * 2. DevTools → Application → Session Storage → `clarispec_auth_trace` (JSON array).
 * 3. Optional env: `NEXT_PUBLIC_AUTH_TRACE=1` (always record for that build).
 *
 * ## Verbose console + 5s pause before redirect
 * - `/login?authDebug=1` — also persists flags in sessionStorage for this tab so you do not
 *   lose verbose mode when the URL no longer has the query string.
 * - Or `localStorage` / `sessionStorage` key `clarispec_debug_auth` = `1`.
 * - Or `NEXT_PUBLIC_DEBUG_AUTH=1` (rebuild for production).
 *
 * Console still clears on navigation unless DevTools "Preserve log" is on; use `authTrace` for durable logs.
 */

const PREFIX = '[clarispec:auth]'
const LS_KEY = 'clarispec_debug_auth'
const TRACE_ON_KEY = 'clarispec_auth_trace_on'
const TRACE_DATA_KEY = 'clarispec_auth_trace'

let lastTraceDumpSerialized = ''

function readVerboseFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('authDebug') === '1'
  } catch {
    return false
  }
}

/** Call on mount (and on route changes via AuthTraceSink) so `?authTrace=1` / `?authDebug=1` stick for the tab. */
export function initAuthDebugFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const p = new URLSearchParams(window.location.search)
    if (p.get('authDebug') === '1') {
      sessionStorage.setItem(LS_KEY, '1')
      sessionStorage.setItem(TRACE_ON_KEY, '1')
    }
    if (p.get('authTrace') === '1') {
      sessionStorage.setItem(TRACE_ON_KEY, '1')
    }
  } catch {
    /* private mode, etc. */
  }
}

export function isAuthDebugVerbose(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') return true
  if (readVerboseFromUrl()) return true
  try {
    if (window.localStorage.getItem(LS_KEY) === '1') return true
    if (window.sessionStorage.getItem(LS_KEY) === '1') return true
    return false
  } catch {
    return false
  }
}

export function isAuthTraceRecording(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_AUTH_TRACE === '1') return true
  try {
    return sessionStorage.getItem(TRACE_ON_KEY) === '1'
  } catch {
    return false
  }
}

/** True in local `next dev` OR when verbose flags are on. */
export function isAuthDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'development' || isAuthDebugVerbose()
}

function safeDetail(d?: Record<string, unknown>): Record<string, unknown> {
  if (!d) return {}
  try {
    return JSON.parse(JSON.stringify(d)) as Record<string, unknown>
  } catch {
    return { _note: 'detail not JSON-serializable' }
  }
}

function authTraceAppend(step: string, detail?: Record<string, unknown>): void {
  if (!isAuthTraceRecording()) return
  if (typeof window === 'undefined') return
  try {
    const row: Record<string, unknown> = {
      step,
      t: Date.now(),
      iso: new Date().toISOString(),
      path: window.location.pathname + window.location.search,
      ...safeDetail(detail),
    }
    const raw = sessionStorage.getItem(TRACE_DATA_KEY)
    const arr: Record<string, unknown>[] = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []
    arr.push(row)
    sessionStorage.setItem(TRACE_DATA_KEY, JSON.stringify(arr.slice(-100)))
  } catch {
    /* ignore */
  }
}

/**
 * Structured log: writes to sessionStorage when trace is on; prints to console when dev/verbose.
 * Prefer this over authDebugLog in auth forms.
 */
export function authLog(step: string, detail?: Record<string, unknown>): void {
  authTraceAppend(step, detail)
  if (!isAuthDebugEnabled()) return
  console.log(PREFIX, new Date().toISOString(), step, detail ?? {})
}

/** @deprecated Prefer authLog — same console behavior, no trace. */
export function authDebugLog(...args: unknown[]): void {
  if (!isAuthDebugEnabled()) return
  console.log(PREFIX, new Date().toISOString(), ...args)
}

/** After navigation, dumps updated trace once (deduped). */
export function dumpAuthTraceToConsole(reason: string): void {
  if (typeof window === 'undefined') return
  try {
    const raw = sessionStorage.getItem(TRACE_DATA_KEY) ?? '[]'
    if (raw === '[]') return
    if (raw === lastTraceDumpSerialized) return
    lastTraceDumpSerialized = raw
    const rows = JSON.parse(raw) as unknown[]
    console.warn(`[clarispec:auth-trace] ${reason} (${rows.length} events)`, rows)
  } catch {
    /* ignore */
  }
}

export function clearAuthTraceBuffer(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(TRACE_DATA_KEY)
    lastTraceDumpSerialized = ''
  } catch {
    /* ignore */
  }
}

/** Names of Supabase auth cookies (no values). */
export function listSupabaseCookieNames(): string[] {
  if (typeof document === 'undefined') return []
  return document.cookie
    .split('; ')
    .map((part) => part.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name && name.startsWith('sb-')))
}

export const AUTH_DEBUG_REDIRECT_DELAY_MS = 5000

export async function authDebugPauseBeforeRedirect(): Promise<void> {
  const verbose = isAuthDebugVerbose()
  authLog('auth:pause', {
    verbose,
    waitMs: verbose ? AUTH_DEBUG_REDIRECT_DELAY_MS : 0,
  })
  if (!verbose) return
  console.info(
    PREFIX,
    `Waiting ${AUTH_DEBUG_REDIRECT_DELAY_MS}ms before redirect. Trace is also in sessionStorage (clarispec_auth_trace).`
  )
  await new Promise((r) => setTimeout(r, AUTH_DEBUG_REDIRECT_DELAY_MS))
}
