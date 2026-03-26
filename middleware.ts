import { updateSession } from '@/lib/supabase/middleware'
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
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(sig),
      encoder.encode(payloadB64)
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

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAdminLogin = request.nextUrl.pathname === '/admin/login'
    if (!isAdminLogin) {
      const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
      const valid = await hasValidAdminToken(adminCookie)
      if (!valid) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }
    }
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
