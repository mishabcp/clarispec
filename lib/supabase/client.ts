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

/** Singleton browser Supabase client. */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: getSupabaseCookieOptions() }
    )
    patchRealtimeSetAuthUnhandledRejection(browserClient)
  }
  return browserClient
}
