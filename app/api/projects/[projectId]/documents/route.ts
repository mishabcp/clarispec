import { createClient } from '@/lib/supabase/server'
import { projectIdFromParams } from '@/lib/route-params'
import { NextResponse } from 'next/server'
import { asDocumentType, asObject, asString, asVersion } from '@/lib/validation'
import { isSameOrigin } from '@/lib/security'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const projectId = await projectIdFromParams(ctx.params)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('generated_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const projectId = await projectIdFromParams(ctx.params)
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const raw = await request.json()
  const body = asObject(raw)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const docType = asDocumentType(body.doc_type)
  const title = asString(body.title, 180, true)
  const content = asString(body.content, 50000, true)
  const version = asVersion(body.version)
  if (!docType || !title || !content || version === null) {
    return NextResponse.json({ error: 'Invalid document payload' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      doc_type: docType,
      title,
      content,
      version,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }

  return NextResponse.json(data)
}
