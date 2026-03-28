import { isPerfLogEnabled, hasPerfPersistence } from '@/lib/perf-log/enabled'
import type { PerfEventRow } from '@/lib/perf-log/types'

let persistWarned = false

function toRow(input: PerfEventRow): Record<string, unknown> {
  return {
    source: input.source,
    kind: input.kind,
    name: input.name,
    duration_ms: input.duration_ms,
    path: input.path ?? null,
    method: input.method ?? null,
    status: input.status ?? null,
    correlation_id: input.correlation_id ?? null,
    meta: input.meta ?? {},
  }
}

/** Edge- and Node-safe: Supabase REST only (no server-only imports). */
export async function insertPerfEvents(rows: PerfEventRow[]): Promise<void> {
  if (!isPerfLogEnabled() || rows.length === 0) return
  if (!hasPerfPersistence()) {
    if (!persistWarned && process.env.NODE_ENV === 'development') {
      persistWarned = true
      console.warn(
        '[perf] PERF_LOG enabled but Supabase URL or SUPABASE_SERVICE_ROLE_KEY missing — events not stored.'
      )
    }
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/perf_events`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows.map(toRow)),
  })

  if (!res.ok && !persistWarned) {
    persistWarned = true
    const text = await res.text().catch(() => '')
    console.warn('[perf] insert failed', res.status, text.slice(0, 200))
  }
}
