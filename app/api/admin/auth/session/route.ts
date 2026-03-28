import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { perfStubRequest, runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stub = perfStubRequest('/api/admin/auth/session', 'GET')
  return runTimedApiRoute('GET /api/admin/auth/session', 'GET', stub, async () => {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true, admin: session })
  })
}
