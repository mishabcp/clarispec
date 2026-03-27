import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

/**
 * SupabaseClient syncs JWT to Realtime via realtime.setAuth() from onAuthStateChange
 * but does not await or .catch() that promise (unlike the initial accessToken path).
 * When the Realtime socket is closing, setAuth can reject with "Connection closed" —
 * a benign race, not an auth failure.
 */
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

/** Single browser client — avoids multiple GoTrue instances and stray "Connection closed" noise. */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    patchRealtimeSetAuthUnhandledRejection(browserClient)
  }
  return browserClient
}
