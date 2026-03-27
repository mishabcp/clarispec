/**
 * Browser-only auth debugging. Does nothing unless enabled (see below).
 *
 * Enable verbose logs + optional 5s pause before redirect:
 * - In the browser console: localStorage.setItem('clarispec_debug_auth', '1') then reload
 * - Or set NEXT_PUBLIC_DEBUG_AUTH=1 in .env / hosting env
 *
 * Console clears on navigation unless you turn on Preserve log:
 * Chrome/Edge DevTools → Console → gear or top bar → check "Preserve log".
 *
 * Lighter logging (no pause) in local dev only: NODE_ENV=development without the flags above
 * still logs basics from LoginForm when you use authDebugLogDev.
 */

const PREFIX = '[clarispec:auth]'
const LS_KEY = 'clarispec_debug_auth'

export function isAuthDebugVerbose(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') return true
  try {
    return window.localStorage.getItem(LS_KEY) === '1'
  } catch {
    return false
  }
}

/** True in local `next dev` OR when verbose flags are on. */
export function isAuthDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'development' || isAuthDebugVerbose()
}

/** Logs only when dev or verbose (avoids noisy production consoles). */
export function authDebugLog(...args: unknown[]): void {
  if (!isAuthDebugEnabled()) return
  console.log(PREFIX, new Date().toISOString(), ...args)
}

/** Names of Supabase auth cookies (no values). */
export function listSupabaseCookieNames(): string[] {
  if (typeof document === 'undefined') return []
  return document.cookie
    .split('; ')
    .map((part) => part.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name && name.startsWith('sb-')))
}

/** Pause only when verbose — gives you time to read the console; use Preserve log too. */
export const AUTH_DEBUG_REDIRECT_DELAY_MS = 5000

export async function authDebugPauseBeforeRedirect(): Promise<void> {
  if (!isAuthDebugVerbose()) return
  console.info(
    PREFIX,
    `Waiting ${AUTH_DEBUG_REDIRECT_DELAY_MS}ms before redirect. Enable Console "Preserve log" so lines stay after navigation.`
  )
  await new Promise((r) => setTimeout(r, AUTH_DEBUG_REDIRECT_DELAY_MS))
}
