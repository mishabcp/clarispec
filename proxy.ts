import { updateSession } from '@/lib/supabase/middleware'
import { logProxyDebug } from '@/lib/proxy-debug'
import { recordPerf } from '@/lib/perf-log/record'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_SESSION_COOKIE = 'clarispec_admin_session'

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function hasValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return false
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return false
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigBytes = base64UrlToBytes(sig)
    const payloadBytes = encoder.encode(payloadB64)
    // Copy so backing buffer is a plain ArrayBuffer (strict DOM typings vs SharedArrayBuffer)
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(sigBytes),
      new Uint8Array(payloadBytes)
    )
    if (!validSignature) return false
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64))
    const payload = JSON.parse(payloadJson) as { exp?: number }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const t0 = performance.now()
  const path = request.nextUrl.pathname
  const correlationId = crypto.randomUUID()

  const finish = (response: NextResponse, branch: string) => {
    recordPerf({
      source: 'edge',
      kind: 'proxy',
      name: 'proxy',
      path,
      method: request.method,
      duration_ms: performance.now() - t0,
      status: response.status,
      correlation_id: correlationId,
      meta: { branch },
    })
    return response
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    logProxyDebug('branch:admin', request, {
      hasAdminSessionCookie: Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value),
    })
    const isAdminLogin = request.nextUrl.pathname === '/admin/login'
    if (!isAdminLogin) {
      const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
      const valid = await hasValidAdminToken(adminCookie)
      if (!valid) {
        logProxyDebug('action:redirect_admin_to_login', request, { adminTokenValid: false })
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        const redirect = NextResponse.redirect(url)
        redirect.headers.set('x-correlation-id', correlationId)
        return finish(redirect, 'admin-redirect-login')
      }
    }
    const headers = new Headers(request.headers)
    headers.set('x-correlation-id', correlationId)
    const next = NextResponse.next({ request: { headers } })
    next.headers.set('x-correlation-id', correlationId)
    return finish(next, 'admin')
  }

  logProxyDebug('branch:app→updateSession', request, {})
  const res = await updateSession(request, correlationId)
  return finish(res, 'app')
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
