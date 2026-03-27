/**
 * Insert into public.app_logs via PostgREST + service role.
 * Safe for Edge (middleware) and Node (API routes, RSC).
 */

export type AppLogSource = 'client' | 'edge' | 'server'
export type AppLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type AppLogPayload = {
  source: AppLogSource
  level: AppLogLevel
  message: string
  context?: Record<string, unknown>
  path?: string | null
  user_agent?: string | null
  release?: string | null
  user_id?: string | null
}

const FORBIDDEN_KEY = /password|secret|authorization|cookie|bearer|apikey|api_key|access_token|refresh_token/i

function sanitizeContext(
  obj: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  if (depth > 3) return { _depth: 'max' }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (FORBIDDEN_KEY.test(k)) continue
    if (v === null || typeof v === 'boolean' || typeof v === 'number') {
      out[k] = v
    } else if (typeof v === 'string') {
      out[k] = v.length > 800 ? `${v.slice(0, 800)}…` : v
    } else if (Array.isArray(v)) {
      out[k] = v.slice(0, 20).map((x) =>
        typeof x === 'object' && x !== null ? '[item]' : x
      )
    } else if (typeof v === 'object' && v !== null) {
      out[k] = sanitizeContext(v as Record<string, unknown>, depth + 1)
    }
  }
  return out
}

export async function ingestAppLogPayload(
  payload: AppLogPayload
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  const row = {
    source: payload.source,
    level: payload.level,
    message: payload.message.slice(0, 8000),
    context: sanitizeContext(payload.context ?? {}),
    path: payload.path ? payload.path.slice(0, 2048) : null,
    user_agent: payload.user_agent ? payload.user_agent.slice(0, 512) : null,
    release: payload.release ? payload.release.slice(0, 128) : null,
    user_id: payload.user_id ?? null,
  }

  try {
    const res = await fetch(`${url}/rest/v1/app_logs`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([row]),
    })
    return res.ok
  } catch {
    return false
  }
}
