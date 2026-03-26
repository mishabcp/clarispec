import { createClient } from '@/lib/supabase/server'
import { projectIdFromParams } from '@/lib/route-params'
import { NextResponse } from 'next/server'
import { asDepthLevel, asObject, asString } from '@/lib/validation'
import { isSameOrigin } from '@/lib/security'

export async function GET(
  _request: Request,
  ctx: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  const projectId = await projectIdFromParams(ctx.params)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  ctx: { params: { projectId: string } | Promise<{ projectId: string }> }
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

  const raw = await request.json()
  const body = asObject(raw)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if ('name' in body) {
    const value = asString(body.name, 120, true)
    if (!value) return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    updates.name = value
  }
  if ('client_name' in body) {
    const value = asString(body.client_name, 120)
    if (value === null) return NextResponse.json({ error: 'Invalid client_name' }, { status: 400 })
    updates.client_name = value || null
  }
  if ('client_industry' in body) {
    const value = asString(body.client_industry, 120)
    if (value === null) return NextResponse.json({ error: 'Invalid client_industry' }, { status: 400 })
    updates.client_industry = value || null
  }
  if ('initial_brief' in body) {
    const value = asString(body.initial_brief, 12000, true)
    if (!value) return NextResponse.json({ error: 'Invalid initial_brief' }, { status: 400 })
    updates.initial_brief = value
  }
  if ('depth_level' in body) {
    const value = asDepthLevel(body.depth_level)
    if (!value) return NextResponse.json({ error: 'Invalid depth_level' }, { status: 400 })
    updates.depth_level = value
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  ctx: { params: { projectId: string } | Promise<{ projectId: string }> }
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

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
