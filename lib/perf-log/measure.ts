import { recordPerf } from '@/lib/perf-log/record'
import type { PerfSource } from '@/lib/perf-log/types'

export async function measureAsync<T>(
  source: PerfSource,
  kind: string,
  name: string,
  fn: () => Promise<T>,
  extra?: { path?: string; correlation_id?: string; meta?: Record<string, unknown> }
): Promise<T> {
  const t0 = performance.now()
  try {
    const result = await fn()
    recordPerf({
      source,
      kind,
      name,
      duration_ms: performance.now() - t0,
      path: extra?.path ?? null,
      correlation_id: extra?.correlation_id ?? null,
      meta: { ok: true, ...extra?.meta },
    })
    return result
  } catch (err) {
    recordPerf({
      source,
      kind,
      name,
      duration_ms: performance.now() - t0,
      path: extra?.path ?? null,
      correlation_id: extra?.correlation_id ?? null,
      meta: {
        ok: false,
        error: err instanceof Error ? err.message.slice(0, 200) : 'unknown',
        ...extra?.meta,
      },
    })
    throw err
  }
}
