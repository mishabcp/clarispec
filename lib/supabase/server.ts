import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { requireServerEnv } from '@/lib/server-config'

export async function createClient() {
  // Next.js `cookies()` is async in some runtimes; unwrap once so the supabase
  // cookie adapter can synchronously access the cookie store.
  const cookieStore = await cookies()
  const supabaseUrl = requireServerEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireServerEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Component — cookie can't be set
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Server Component — cookie can't be removed
          }
        },
      },
    }
  )
}

export function createAdminClient() {
  const supabaseUrl = requireServerEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey
  )
}
