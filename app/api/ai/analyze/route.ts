import { NextResponse } from 'next/server'
import { generateForChat } from '@/lib/ai/provider'
import { getAnalyzerPrompt } from '@/lib/ai/prompts/analyzer'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system'
import { parseAIResponse } from '@/lib/ai/conversation'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, isSameOrigin } from '@/lib/security'
import { asObject, asString } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    if (!(await checkRateLimit(`ai-analyze:${user.id}:${ip}`, 30, 60 * 1000))) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    const raw = await request.json()
    const body = asObject(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const brief = asString(body.brief, 12000, true)

    if (!brief) {
      return NextResponse.json({ error: 'Brief is required' }, { status: 400 })
    }

    const prompt = getAnalyzerPrompt(brief)
    const responseText = await generateForChat(SYSTEM_PROMPT, prompt)
    const parsed = parseAIResponse(responseText)

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    const safeParsed = asObject(parsed)
    if (!safeParsed || JSON.stringify(safeParsed).length > 50000) {
      return NextResponse.json({ error: 'AI response failed validation' }, { status: 500 })
    }

    return NextResponse.json(safeParsed)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isRateLimit =
      (error instanceof Error && /429|quota|rate limit/i.test(message)) ||
      (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429)
    if (isRateLimit) {
      console.warn('AI Analyze rate-limited')
      return NextResponse.json(
        { error: 'AI is at capacity. Please try again in a minute.' },
        { status: 429 }
      )
    }
    console.error('AI Analyze error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
