import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { requireServerEnv } from '@/lib/server-config'
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = requireServerEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireServerEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options })
          })
        } catch {
          // Server Component / read-only context — cookies cannot be set
        }
      },
    },
  })
}

export function createAdminClient() {
  const supabaseUrl = requireServerEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey
  )
}
