import { recordPerf } from '@/lib/perf-log/record'

/** For route handlers that do not receive a `Request` (e.g. `GET()` with no args). */
export function perfStubRequest(path: string, method: string): Request {
  return new Request(`http://127.0.0.1${path.startsWith('/') ? path : `/${path}`}`, {
    method,
  })
}

export async function runTimedApiRoute(
  name: string,
  method: string,
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const t0 = performance.now()
  let path: string
  try {
    path = new URL(request.url).pathname
  } catch {
    path = ''
  }
  const correlationId =
    request.headers.get('x-correlation-id') ??
    request.headers.get('X-Correlation-Id') ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null)

  try {
    const res = await handler()
    recordPerf({
      source: 'server',
      kind: 'api',
      name,
      method,
      path,
      duration_ms: performance.now() - t0,
      status: res.status,
      correlation_id: correlationId,
    })
    return res
  } catch (err) {
    recordPerf({
      source: 'server',
      kind: 'api',
      name,
      method,
      path,
      duration_ms: performance.now() - t0,
      status: 500,
      correlation_id: correlationId,
      meta: {
        thrown: true,
        error: err instanceof Error ? err.message.slice(0, 200) : 'unknown',
      },
    })
    throw err
  }
}
