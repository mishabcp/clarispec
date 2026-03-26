import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const ADMIN_SESSION_COOKIE = 'clarispec_admin_session'

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
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
export function setAdminSession(adminId: string) {
  const cookieStore = cookies()
  const token = `${adminId}:${hashPassword(adminId + process.env.SUPABASE_SERVICE_ROLE_KEY)}`
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

/**
 * Get the current admin session from cookie. Returns the admin record or null.
 */
export async function getAdminSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null

  const [adminId, sig] = token.split(':')
  if (!adminId || !sig) return null

  const expectedSig = hashPassword(adminId + process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (sig !== expectedSig) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('superadmins')
    .select('id, email, name')
    .eq('id', adminId)
    .single()

  return data as { id: string; email: string; name: string | null } | null
}

/**
 * Clear admin session cookie.
 */
export function clearAdminSession() {
  const cookieStore = cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
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
