import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return runTimedApiRoute('GET /api/admin/document-selections', 'GET', request, async () => {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limitRaw = searchParams.get('limit')
    const limit = Math.min(2000, Math.max(1, Number(limitRaw) || 1000))

    let query = admin
      .from('document_selections')
      .select('id, project_id, doc_type, is_selected, projects(name)')
      .order('project_id', { ascending: true })
      .order('doc_type', { ascending: true })
      .limit(limit)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: rows, error } = await query
    if (error) throw error

    const selections = (rows || []).map((r) => ({
      id: r.id,
      project_id: r.project_id,
      doc_type: r.doc_type,
      is_selected: r.is_selected,
      projectName: (r as { projects?: { name?: string } }).projects?.name ?? 'Unknown',
    }))

    return NextResponse.json(selections)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
