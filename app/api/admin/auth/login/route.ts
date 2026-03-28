import { NextResponse } from 'next/server'
import { assertAdminSessionStorageReady, validateAdminCredentials, setAdminSession } from '@/lib/admin'
import { checkRateLimit, getClientIp, isSameOrigin } from '@/lib/security'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return runTimedApiRoute('POST /api/admin/auth/login', 'POST', request, async () => {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    await assertAdminSessionStorageReady()

    const { email, password } = await request.json() as { email?: string; password?: string }
    const normalizedEmail = email?.toLowerCase().trim() || ''
    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const ip = getClientIp(request)
    if (!(await checkRateLimit(`admin-login:ip:${ip}`, 40, 15 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }
    if (!(await checkRateLimit(`admin-login:email:${normalizedEmail}`, 20, 15 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }
    if (!(await checkRateLimit(`admin-login:pair:${normalizedEmail}:${ip}`, 8, 15 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }

    const admin = await validateAdminCredentials(normalizedEmail, password)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setAdminSession(admin.id)

    return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
