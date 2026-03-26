type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function getClientIp(request: Request): string {
  const trustProxyHeaders = process.env.TRUST_PROXY_HEADERS === 'true'
  if (trustProxyHeaders) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    const realIp = request.headers.get('x-real-ip')
    if (realIp) return realIp
  }
  // Fall back to a coarse client fingerprint to avoid global shared rate-limit buckets.
  const ua = request.headers.get('user-agent') || 'unknown-ua'
  const lang = request.headers.get('accept-language') || 'unknown-lang'
  return `fp:${ua.slice(0, 120)}|${lang.slice(0, 40)}`
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const reqUrl = new URL(request.url)
    const originUrl = new URL(origin)
    return originUrl.origin === reqUrl.origin
  } catch {
    return false
  }
}

function checkInMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (existing.count >= limit) return false
  existing.count += 1
  return true
}

async function incrementRedisCounter(key: string, windowMs: number): Promise<number | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!redisUrl || !redisToken) return null

  try {
    const incrRes = await fetch(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: 'no-store',
    })
    if (!incrRes.ok) return null
    const incrJson = await incrRes.json() as { result?: number | string }
    const value = Number(incrJson.result ?? 0)
    if (!Number.isFinite(value)) return null

    if (value === 1) {
      await fetch(`${redisUrl}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: 'no-store',
      })
    }
    return value
  } catch {
    return null
  }
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redisCount = await incrementRedisCounter(key, windowMs)
  if (redisCount !== null) {
    return redisCount <= limit
  }
  return checkInMemoryRateLimit(key, limit, windowMs)
}
