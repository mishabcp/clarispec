import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { projectIdFromParams } from '@/lib/route-params'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return runTimedApiRoute('GET /api/admin/projects/[projectId]', 'GET', request, async () => {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const projectId = await projectIdFromParams(ctx.params)

    const [
      { data: project },
      { data: messages },
      { data: areas },
      { data: documents },
    ] = await Promise.all([
      admin.from('projects').select('*').eq('id', projectId).single(),
      admin.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
      admin.from('requirement_areas').select('*').eq('project_id', projectId).order('area_name'),
      admin.from('documents').select('id, project_id, doc_type, title, content, version, generated_at').eq('project_id', projectId).order('generated_at', { ascending: true }),
    ])

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: owner } = await admin
      .from('profiles')
      .select('id, full_name, company_name')
      .eq('id', project.user_id)
      .single()

    // Get owner email from auth
    let ownerEmail = ''
    try {
      const { data: { users } } = await admin.auth.admin.listUsers()
      const authUser = users.find((u: { id: string }) => u.id === project.user_id)
      ownerEmail = authUser?.email || ''
    } catch { /* ignore */ }

    const docsPreview = documents?.map(d => ({
      ...d,
      content: d.content.substring(0, 200) + (d.content.length > 200 ? '...' : ''),
    })) || []

    return NextResponse.json({
      project,
      owner: { ...owner, email: ownerEmail },
      messages: messages || [],
      areas: areas || [],
      documents: docsPreview,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
