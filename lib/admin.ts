import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import 'server-only'

const ADMIN_SESSION_COOKIE = 'clarispec_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8
const PBKDF2_ITERATIONS = 210000
const PBKDF2_KEYLEN = 32
const PBKDF2_DIGEST = 'sha256'

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is required')
  }
  return secret
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex')
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash.startsWith('pbkdf2$')) return false
  const [, iterationsStr, salt, expected] = hash.split('$')
  const iterations = Number(iterationsStr)
  if (!iterations || !salt || !expected) return false
  const actual = crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex')
  if (actual.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

function signSessionPayload(payloadB64: string): string {
  const secret = getAdminSecret()
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

function makeSessionToken(adminId: string): string {
  const now = Math.floor(Date.now() / 1000)
  const sid = crypto.randomUUID()
  const payload = {
    adminId,
    sid,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex'),
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = signSessionPayload(payloadB64)
  return `${payloadB64}.${sig}`
}

function parseSessionToken(token: string): { adminId: string; sid: string; exp: number } | null {
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  const expectedSig = signSessionPayload(payloadB64)
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      adminId?: string
      sid?: string
      exp?: number
    }
    if (!payload.adminId || !payload.sid || !payload.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { adminId: payload.adminId, sid: payload.sid, exp: payload.exp }
  } catch {
    return null
  }
}

/**
 * Validate admin credentials against the superadmins table.
 * Returns the admin record on success, null on failure.
 */
export async function validateAdminCredentials(email: string, password: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('superadmins')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!data) return null
  if (!verifyPassword(password, data.password_hash)) return null

  return data as { id: string; email: string; name: string | null }
}

/**
 * Set a signed admin session cookie.
 */
export async function setAdminSession(adminId: string) {
  const cookieStore = await cookies()
  const token = makeSessionToken(adminId)
  const session = parseSessionToken(token)
  if (!session) {
    throw new Error('Failed to generate admin session token')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('admin_sessions').insert({
    id: session.sid,
    admin_id: adminId,
    expires_at: new Date(session.exp * 1000).toISOString(),
  })
  if (error) {
    throw new Error('Failed to persist admin session')
  }

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

/**
 * Get the current admin session from cookie. Returns the admin record or null.
 */
export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null

  const session = parseSessionToken(token)
  if (!session) return null

  const admin = createAdminClient()

  const { data: dbSession, error: sessionError } = await admin
    .from('admin_sessions')
    .select('id')
    .eq('id', session.sid)
    .eq('admin_id', session.adminId)
    .is('revoked_at', null)
    .single()
  if (sessionError || !dbSession) return null

  const { data } = await admin
    .from('superadmins')
    .select('id, email, name')
    .eq('id', session.adminId)
    .single()

  return data as { id: string; email: string; name: string | null } | null
}

/**
 * Clear admin session cookie.
 */
export async function clearAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = token ? parseSessionToken(token) : null
  if (session) {
    const admin = createAdminClient()
    const { error } = await admin
      .from('admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', session.sid)
      .eq('admin_id', session.adminId)
    if (error) {
      throw new Error('Failed to revoke admin session')
    }
  }
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Check if there's a valid admin session. For use in API routes.
 */
export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) return null
  return session
}

export async function assertAdminSessionStorageReady() {
  const admin = createAdminClient()
  const { error } = await admin.from('admin_sessions').select('id').limit(1)
  if (error) {
    throw new Error('admin_sessions table is required')
  }
}
