/**
 * Dev: on unless PERF_LOG=0. Prod: on only when PERF_LOG=1.
 * Requires SUPABASE_SERVICE_ROLE_KEY + migration for rows to persist.
 */
export function isPerfLogEnabled(): boolean {
  if (process.env.PERF_LOG === '0') return false
  if (process.env.PERF_LOG === '1') return true
  return process.env.NODE_ENV === 'development'
}

export function hasPerfPersistence(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
