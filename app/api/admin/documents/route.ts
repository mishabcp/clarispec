import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

function sanitizeSearch(value: string): string {
  return value.replace(/[%*,()]/g, '').trim()
}

export async function GET(request: Request) {
  return runTimedApiRoute('GET /api/admin/documents', 'GET', request, async () => {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const docType = searchParams.get('docType')
    const limitRaw = searchParams.get('limit')
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100))

    let query = admin
      .from('documents')
      .select('id, project_id, doc_type, title, version, generated_at, projects(name)')
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (docType) {
      query = query.eq('doc_type', docType)
    }
    if (search) {
      const cleaned = sanitizeSearch(search)
      if (cleaned) {
        query = query.ilike('title', `%${cleaned}%`)
      }
    }

    const { data: rows, error } = await query
    if (error) throw error

    const documents = (rows || []).map((d) => ({
      id: d.id,
      project_id: d.project_id,
      doc_type: d.doc_type,
      title: d.title,
      version: d.version,
      generated_at: d.generated_at,
      projectName: (d as { projects?: { name?: string } }).projects?.name ?? 'Unknown',
    }))

    return NextResponse.json(documents)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
