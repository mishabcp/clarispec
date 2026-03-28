export type PerfSource = 'server' | 'client' | 'edge'

export interface PerfEventInput {
  source: PerfSource
  kind: string
  name: string
  duration_ms: number
  path?: string | null
  method?: string | null
  status?: number | null
  correlation_id?: string | null
  meta?: Record<string, unknown>
}

export interface PerfEventRow extends PerfEventInput {
  path: string | null
  method: string | null
  status: number | null
  correlation_id: string | null
  meta: Record<string, unknown>
}
