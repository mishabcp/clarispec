import { NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/admin'
import { isSameOrigin } from '@/lib/security'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return runTimedApiRoute('POST /api/admin/auth/logout', 'POST', request, async () => {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    await clearAdminSession()
    return NextResponse.json({ success: true })
  })
}
