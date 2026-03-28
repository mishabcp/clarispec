import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

/**
 * List-only audit: no message body (PII / size). project_id links to admin project detail.
 */
export async function GET(request: Request) {
  return runTimedApiRoute('GET /api/admin/messages', 'GET', request, async () => {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limitRaw = searchParams.get('limit')
    const limit = Math.min(300, Math.max(1, Number(limitRaw) || 150))

    let query = admin
      .from('messages')
      .select('id, project_id, role, message_type, created_at, projects(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: rows, error } = await query
    if (error) throw error

    const messages = (rows || []).map((m) => ({
      id: m.id,
      project_id: m.project_id,
      role: m.role,
      message_type: m.message_type,
      created_at: m.created_at,
      projectName: (m as { projects?: { name?: string } }).projects?.name ?? 'Unknown',
    }))

    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
