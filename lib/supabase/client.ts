import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options'

let browserClient: SupabaseClient | undefined

/** Swallow benign Realtime setAuth rejections when the socket is closing. */
function isBenignRealtimeSetAuthFailure(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : ''
  const t = msg.trim()
  return t === 'Connection closed' || t === 'Connection closed.'
}

function patchRealtimeSetAuthUnhandledRejection(client: SupabaseClient) {
  const rt = client.realtime
  const original = rt.setAuth.bind(rt)
  rt.setAuth = (token?: string | null) =>
    original(token).catch((err: unknown) => {
      if (isBenignRealtimeSetAuthFailure(err)) return
      throw err
    })
}

/**
 * Realtime can reject with "Connection closed" on paths we do not patch (not only `setAuth`).
 * That surfaces as an uncaught promise — red in DevTools and easy to mistake for "nothing else logs".
 * `preventDefault()` stops the browser from printing that default unhandled-rejection line.
 */
let benignRealtimeRejectionGuardInstalled = false

function installBenignRealtimeUnhandledRejectionGuard() {
  if (typeof window === 'undefined' || benignRealtimeRejectionGuardInstalled) return
  benignRealtimeRejectionGuardInstalled = true
  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignRealtimeSetAuthFailure(event.reason)) {
      event.preventDefault()
    }
  })
}

/** Singleton browser Supabase client. */
export function createClient() {
  if (!browserClient) {
    installBenignRealtimeUnhandledRejectionGuard()
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: getSupabaseCookieOptions() }
    )
    patchRealtimeSetAuthUnhandledRejection(browserClient)
  }
  return browserClient
}
