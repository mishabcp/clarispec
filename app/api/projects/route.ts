import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { asDepthLevel, asObject, asString } from '@/lib/validation'
import { isSameOrigin } from '@/lib/security'
import { perfStubRequest, runTimedApiRoute } from '@/lib/perf-log/timed-api'

export async function GET() {
  const stub = perfStubRequest('/api/projects', 'GET')
  return runTimedApiRoute('GET /api/projects', 'GET', stub, async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  return NextResponse.json(data)
  })
}

export async function POST(request: Request) {
  return runTimedApiRoute('POST /api/projects', 'POST', request, async () => {
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

  const name = asString(body.name, 120, true)
  const initialBrief = asString(body.initial_brief, 12000, true)
  const clientName = asString(body.client_name, 120)
  const clientIndustry = asString(body.client_industry, 120)
  const depthLevel = asDepthLevel(body.depth_level) || 'standard'
  if (!name || !initialBrief) {
    return NextResponse.json({ error: 'name and initial_brief are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      client_name: clientName || null,
      client_industry: clientIndustry || null,
      initial_brief: initialBrief,
      depth_level: depthLevel,
      status: 'gathering',
      requirement_score: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  return NextResponse.json(data)
  })
}
