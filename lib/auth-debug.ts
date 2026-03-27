/**
 * Auth debug (browser only).
 *
 * ## When things run
 * - `isAuthDebugEnabled()` → `NODE_ENV === 'development'` OR `isAuthDebugVerbose()`.
 * - `isAuthDebugVerbose()` → `NEXT_PUBLIC_DEBUG_AUTH=1` OR `localStorage clarispec_debug_auth=1`.
 * - `authDebugLog()` → when `isAuthDebugEnabled()` (dev logs OR verbose).
 * - `authDebugPauseBeforeRedirect()` → only when `isAuthDebugVerbose()` (production needs env or localStorage).
 * - In production with neither flag: no logs, no pause (unchanged UX).
 *
 * ## Click → session → navigation (login)
 * 1. Submit: `signInWithPassword` writes session to cookie storage (Supabase browser client).
 * 2. `authDebugPauseBeforeRedirect` (verbose only): countdown; no navigation yet.
 * 3. `router.refresh()`: RSC refetch; can remount `/login` → **mount `useEffect` + `getSession`** must NOT
 *    `router.replace('/dashboard')` while verbose, or it bypasses the pause in submit.
 * 4. `router.push('/dashboard')` or manual “Continue” (if `clarispec_debug_auth_manual=1`).
 * 5. Proxy `updateSession` runs on the next request: `getUser()` reads cookies; guest → redirect `/login`.
 *
 * ## Console “losing” logs
 * Browsers clear the console on navigation unless DevTools **Preserve log** is on. Code cannot force the
 * console to keep history; use Preserve log, this pause, or the on-page panel below.
 *
 * ## Enable (local or hosted)
 * - `localStorage.setItem('clarispec_debug_auth','1')` → reload (verbose: pause + panel + extra logs).
 * - `NEXT_PUBLIC_DEBUG_AUTH=1` in env → rebuild for production.
 * - Optional delay: `NEXT_PUBLIC_AUTH_DEBUG_DELAY_MS` (default 5000, max 120000, 0 = skip wait).
 * - Optional manual navigation: `localStorage.setItem('clarispec_debug_auth_manual','1')` (requires verbose).
 * - Server: `AUTH_DEBUG_PROXY=1` → terminal/host logs from `lib/supabase/middleware.ts`.
 */

const PREFIX = '[clarispec:auth]'
const LS_VERBOSE = 'clarispec_debug_auth'
const LS_MANUAL = 'clarispec_debug_auth_manual'

export function isAuthDebugVerbose(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') return true
  try {
    return window.localStorage.getItem(LS_VERBOSE) === '1'
  } catch {
    return false
  }
}

/** Manual “Continue to dashboard” after pause; only with verbose. */
export function isAuthDebugManualRedirect(): boolean {
  if (!isAuthDebugVerbose()) return false
  try {
    return window.localStorage.getItem(LS_MANUAL) === '1'
  } catch {
    return false
  }
}

/** True in local `next dev` OR when verbose flags are on. */
export function isAuthDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'development' || isAuthDebugVerbose()
}

export function getAuthDebugRedirectDelayMs(): number {
  const raw = process.env.NEXT_PUBLIC_AUTH_DEBUG_DELAY_MS
  if (raw === undefined || raw === '') return 5000
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return 5000
  return Math.min(120_000, Math.max(0, n))
}

/** Panel buffer (verbose only); subscribe via useSyncExternalStore in client components. */
let panelLines: string[] = []
const panelListeners = new Set<() => void>()

function notifyPanelListeners() {
  panelListeners.forEach((l) => l())
}

function pushPanelLine(text: string) {
  if (!isAuthDebugVerbose()) return
  const line = `${new Date().toISOString().slice(11, 23)} ${text}`.slice(0, 600)
  panelLines = [...panelLines.slice(-49), line]
  notifyPanelListeners()
}

function replacerNoSecrets(key: string, value: unknown) {
  if (key === 'password' || key === 'access_token' || key === 'refresh_token') return '[redacted]'
  return value
}

function safePanelText(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a
      try {
        return JSON.stringify(a, replacerNoSecrets)
      } catch {
        return String(a)
      }
    })
    .join(' ')
    .slice(0, 500)
}

/** Logs when dev or verbose; panel lines only when verbose. */
export function authDebugLog(...args: unknown[]): void {
  if (!isAuthDebugEnabled()) return
  console.log(PREFIX, new Date().toISOString(), ...args)
  if (isAuthDebugVerbose()) pushPanelLine(safePanelText(args))
}

export function subscribeAuthDebugPanel(onStoreChange: () => void): () => void {
  panelListeners.add(onStoreChange)
  return () => panelListeners.delete(onStoreChange)
}

export function getAuthDebugPanelSnapshot(): readonly string[] {
  return panelLines
}

export function getAuthDebugPanelServerSnapshot(): readonly string[] {
  return []
}

/** Raw `document.cookie` size (no values logged elsewhere). */
export function documentCookieStats(): { rawLength: number; pairCount: number } {
  if (typeof document === 'undefined') return { rawLength: 0, pairCount: 0 }
  const raw = document.cookie
  if (!raw.trim()) return { rawLength: 0, pairCount: 0 }
  return {
    rawLength: raw.length,
    pairCount: raw.split(';').filter((s) => s.trim()).length,
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

/**
 * Waits for the configured delay when verbose. Call **before** `router.refresh()` so a remounted
 * login `useEffect` cannot `router.replace` ahead of this pause.
 */
export async function authDebugPauseBeforeRedirect(
  onRemainingMs?: (ms: number) => void
): Promise<void> {
  if (!isAuthDebugVerbose()) return
  const total = getAuthDebugRedirectDelayMs()
  if (total <= 0) {
    onRemainingMs?.(0)
    console.info(
      PREFIX,
      'NEXT_PUBLIC_AUTH_DEBUG_DELAY_MS is 0 — skipping wait. Use Console “Preserve log” to keep messages after navigation.'
    )
    return
  }
  console.info(
    PREFIX,
    `Waiting ${total}ms before refresh/navigation. Enable Console “Preserve log” to keep lines after navigation.`
  )
  const end = Date.now() + total
  await new Promise<void>((resolve) => {
    const tick = () => {
      const left = Math.max(0, end - Date.now())
      onRemainingMs?.(left)
      if (left <= 0) {
        clearInterval(iv)
        resolve()
      }
    }
    const iv = setInterval(tick, 250)
    tick()
  })
}
