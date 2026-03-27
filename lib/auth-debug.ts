/**
 * Browser-only auth debugging.
 *
 * Enable verbose logs + 5s pause before redirect (works on production builds):
 * - Open: /login?debug_auth=1 (or ?auth_debug=1) — stores flag in sessionStorage for this tab
 * - Or: localStorage.setItem('clarispec_debug_auth', '1') then reload
 * - Or: NEXT_PUBLIC_DEBUG_AUTH=1 in env (rebuild required)
 *
 * The browser console often clears on navigation. When verbose mode is on, Login/Signup
 * render an on-page log panel; also use DevTools → Console → "Preserve log" if you want
 * the native console to keep lines.
 */

const PREFIX = '[clarispec:auth]'
const LS_KEY = 'clarispec_debug_auth'

type LogListener = (line: string) => void
const logListeners = new Set<LogListener>()

export function subscribeAuthDebugLogs(listener: LogListener): () => void {
  logListeners.add(listener)
  return () => logListeners.delete(listener)
}

function emitLogLine(line: string): void {
  logListeners.forEach((l) => {
    try {
      l(line)
    } catch {
      /* ignore */
    }
  })
}

/** If URL has ?debug_auth=1 or ?auth_debug=1, enable debug for this tab and strip the param. */
export function syncAuthDebugFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug_auth') !== '1' && params.get('auth_debug') !== '1') return
    sessionStorage.setItem(LS_KEY, '1')
    const url = new URL(window.location.href)
    url.searchParams.delete('debug_auth')
    url.searchParams.delete('auth_debug')
    const qs = url.searchParams.toString()
    window.history.replaceState({}, '', url.pathname + (qs ? `?${qs}` : '') + url.hash)
  } catch {
    /* ignore */
  }
}

export function isAuthDebugVerbose(): boolean {
  if (typeof window === 'undefined') return false
  syncAuthDebugFromUrl()
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') return true
  try {
    return (
      window.localStorage.getItem(LS_KEY) === '1' ||
      window.sessionStorage.getItem(LS_KEY) === '1'
    )
  } catch {
    return false
  }
}

/** True in local `next dev` OR when verbose flags are on. */
export function isAuthDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  syncAuthDebugFromUrl()
  return process.env.NODE_ENV === 'development' || isAuthDebugVerbose()
}

function formatLogArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a)
        } catch {
          return String(a)
        }
      }
      return String(a)
    })
    .join(' ')
}

export function authDebugLog(...args: unknown[]): void {
  if (!isAuthDebugEnabled()) return
  const line = `${PREFIX} ${new Date().toISOString()} ${formatLogArgs(args)}`
  console.log(PREFIX, new Date().toISOString(), ...args)
  emitLogLine(line)
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
  if (!isAuthDebugVerbose()) return
  const line = `${PREFIX} Waiting ${AUTH_DEBUG_REDIRECT_DELAY_MS}ms before redirect. Open Console → enable "Preserve log" to keep native console output after navigation.`
  console.info(line)
  emitLogLine(line)
  await new Promise((r) => setTimeout(r, AUTH_DEBUG_REDIRECT_DELAY_MS))
}
