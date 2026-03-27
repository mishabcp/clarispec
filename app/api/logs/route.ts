import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestAppLogPayload, type AppLogLevel } from '@/lib/app-log-ingest'
import { checkRateLimit, getClientIp, isSameOrigin } from '@/lib/security'

const LEVELS: AppLogLevel[] = ['debug', 'info', 'warn', 'error']

type Body = {
  source?: string
  level?: string
  message?: string
  context?: Record<string, unknown>
  path?: string
  release?: string
}

function releaseTag(): string | null {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    null
  )
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request)
  if (!(await checkRateLimit(`app-logs:post:${ip}`, 120, 60 * 1000))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const source = body.source
  const level = body.level as AppLogLevel
  const message = typeof body.message === 'string' ? body.message : ''

  if (source !== 'client' || !LEVELS.includes(level) || !message.trim()) {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ua = request.headers.get('user-agent')
  const ok = await ingestAppLogPayload({
    source,
    level,
    message,
    context:
      body.context && typeof body.context === 'object' ? body.context : {},
    path: typeof body.path === 'string' ? body.path : null,
    user_agent: ua,
    release: typeof body.release === 'string' ? body.release : releaseTag(),
    user_id: user?.id ?? null,
  })

  if (!ok) {
    return NextResponse.json({ ok: false, error: 'store_failed' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
