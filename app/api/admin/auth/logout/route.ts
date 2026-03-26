import { NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/admin'
import { isSameOrigin } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  await clearAdminSession()
  return NextResponse.json({ success: true })
}
