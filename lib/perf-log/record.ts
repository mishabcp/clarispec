import { insertPerfEvents } from '@/lib/perf-log/persist'
import { isPerfLogEnabled } from '@/lib/perf-log/enabled'
import type { PerfEventInput, PerfEventRow } from '@/lib/perf-log/types'

function normalize(input: PerfEventInput): PerfEventRow {
  return {
    source: input.source,
    kind: input.kind,
    name: input.name,
    duration_ms: input.duration_ms,
    path: input.path ?? null,
    method: input.method ?? null,
    status: input.status ?? null,
    correlation_id: input.correlation_id ?? null,
    meta: sanitizeMeta(input.meta),
  }
}

function sanitizeMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined) continue
    const t = typeof v
    if (t === 'string' || t === 'number' || t === 'boolean') {
      const s = t === 'string' ? (v as string).slice(0, 500) : v
      out[k.slice(0, 64)] = s
    }
  }
  return out
}

/** Non-blocking persist. */
export function recordPerf(input: PerfEventInput): void {
  if (!isPerfLogEnabled()) return
  void insertPerfEvents([normalize(input)]).catch(() => {})
}

export async function recordPerfBatch(inputs: PerfEventInput[]): Promise<void> {
  if (!isPerfLogEnabled() || inputs.length === 0) return
  await insertPerfEvents(inputs.map(normalize)).catch(() => {})
}
