import { NextResponse } from 'next/server'
import { isSameOrigin } from '@/lib/security'
import { recordPerfBatch } from '@/lib/perf-log/record'
import { isPerfLogEnabled } from '@/lib/perf-log/enabled'
import type { PerfEventInput, PerfSource } from '@/lib/perf-log/types'

const MAX_BODY_BYTES = 48_000
const MAX_EVENTS = 80

function asSource(v: unknown): PerfSource | null {
  if (v === 'client') return 'client'
  return null
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  if (!isPerfLogEnabled()) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const len = Number(request.headers.get('content-length') || 0)
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { events?: unknown }).events)) {
    return NextResponse.json({ error: 'Expected { events: [...] }' }, { status: 400 })
  }

  const events = (raw as { events: unknown[] }).events.slice(0, MAX_EVENTS)
  const normalized: PerfEventInput[] = []

  for (const item of events) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    const source = asSource(e.source)
    const kind = typeof e.kind === 'string' ? e.kind.slice(0, 120) : ''
    const name = typeof e.name === 'string' ? e.name.slice(0, 240) : ''
    const duration_ms = typeof e.duration_ms === 'number' && Number.isFinite(e.duration_ms) ? e.duration_ms : NaN
    if (!source || !kind || !name || !(duration_ms >= 0)) continue

    const path = typeof e.path === 'string' ? e.path.slice(0, 500) : undefined
    const method = typeof e.method === 'string' ? e.method.slice(0, 16) : undefined
    const status = typeof e.status === 'number' && Number.isFinite(e.status) ? Math.trunc(e.status) : undefined
    const correlation_id =
      typeof e.correlation_id === 'string' ? e.correlation_id.slice(0, 80) : undefined
    let meta: Record<string, unknown> = {}
    if (e.meta && typeof e.meta === 'object' && !Array.isArray(e.meta)) {
      meta = Object.fromEntries(
        Object.entries(e.meta as Record<string, unknown>)
          .slice(0, 24)
          .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
          .map(([k, v]) => [String(k).slice(0, 64), typeof v === 'string' ? v.slice(0, 400) : v])
      )
    }

    normalized.push({
      source,
      kind,
      name,
      duration_ms,
      path: path ?? null,
      method: method ?? null,
      status: status ?? null,
      correlation_id: correlation_id ?? null,
      meta,
    })
  }

  await recordPerfBatch(normalized)
  return NextResponse.json({ ok: true, accepted: normalized.length })
}
