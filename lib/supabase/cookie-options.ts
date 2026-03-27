import type { CookieOptionsWithName } from '@supabase/ssr'

/**
 * Shared cookie flags for browser + server Supabase clients.
 * `secure: true` in production matches Vercel (HTTPS); localhost dev stays `secure: false`.
 */
export function getSupabaseCookieOptions(): CookieOptionsWithName {
  return {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }
}
