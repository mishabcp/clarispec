import type { NextRequest } from 'next/server'

/** Server-side only. Reserved for future proxy diagnostics (currently no console output). */
export function isProxyAuthDebug(): boolean {
  return process.env.AUTH_DEBUG_PROXY === '1'
}

/** NEXT_PUBLIC_* presence and shape — never log actual keys or URLs. */
export function proxyDebugPublicEnv(): Record<string, unknown> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  let urlHost = 'unset'
  try {
    if (url) urlHost = new URL(url).host
  } catch {
    urlHost = 'invalid_url'
  }
  return {
    envNextPublicSupabaseUrlIsSet: Boolean(url),
    envNextPublicSupabaseUrlHost: urlHost,
    envNextPublicAnonKeyIsSet: Boolean(key),
    envNextPublicAnonKeyCharLength: key.length,
  }
}

export function proxyDebugRequestMeta(request: NextRequest): Record<string, unknown> {
  const all = request.cookies.getAll()
  const rawCookie = request.headers.get('cookie')
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    searchParamsCount: [...request.nextUrl.searchParams.keys()].length,
    host: request.headers.get('host'),
    xForwardedHost: request.headers.get('x-forwarded-host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
    xVercelId: request.headers.get('x-vercel-id')?.slice(0, 24) ?? null,
    secFetchSite: request.headers.get('sec-fetch-site'),
    secFetchMode: request.headers.get('sec-fetch-mode'),
    refererHost: (() => {
      const r = request.headers.get('referer')
      if (!r) return null
      try {
        return new URL(r).host
      } catch {
        return 'invalid_referer'
      }
    })(),
    cookieHeaderLength: rawCookie?.length ?? 0,
    cookieJarNameCount: all.length,
    allCookieNames: all.map((c) => c.name),
    sbCookieNames: all.map((c) => c.name).filter((n) => n.startsWith('sb-')),
  }
}

export function logProxyDebug(
  _phase: string,
  _request: NextRequest,
  _detail: Record<string, unknown> = {}
): void {}
