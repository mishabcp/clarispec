import { createClient } from '@/lib/supabase/server'
import { projectIdFromParams } from '@/lib/route-params'
import { NextResponse } from 'next/server'
import { asMessageType, asObject, asString } from '@/lib/validation'
import { isSameOrigin } from '@/lib/security'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export async function GET(
  request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return runTimedApiRoute('GET /api/projects/[projectId]/messages', 'GET', request, async () => {
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
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json(data)
  })
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return runTimedApiRoute('POST /api/projects/[projectId]/messages', 'POST', request, async () => {
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
  const role = body.role === 'assistant' ? 'assistant' : body.role === 'user' ? 'user' : null
  const content = asString(body.content, 12000, true)
  const messageType = asMessageType(body.message_type) || 'chat'
  if (!role || !content) {
    return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 })
  }

  const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {}

  const { data, error } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      role,
      content,
      message_type: messageType,
      metadata,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }

  return NextResponse.json(data)
  })
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return runTimedApiRoute('DELETE /api/projects/[projectId]/messages', 'DELETE', request, async () => {
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
  const messageId = asString(body?.messageId, 80, true)

  if (!messageId) {
    return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
  }

  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('created_at')
    .eq('id', messageId)
    .eq('project_id', projectId)
    .single()

  if (fetchError || !message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('project_id', projectId)
    .gte('created_at', message.created_at)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
  })
}
