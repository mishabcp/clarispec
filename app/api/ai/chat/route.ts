import { NextResponse } from 'next/server'
import { generateForChat } from '@/lib/ai/provider'
import { getQuestionerPrompt } from '@/lib/ai/prompts/questioner'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system'
import { parseAIResponse } from '@/lib/ai/conversation'
import type { RequirementAreas } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, isSameOrigin } from '@/lib/security'
import { asDepthLevel, asObject, asString, isSafeAIChatResponse } from '@/lib/validation'

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
    if (!(await checkRateLimit(`ai-chat:${user.id}:${ip}`, 60, 60 * 1000))) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    const raw = await request.json()
    const body = asObject(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const {
      brief,
      industry,
      depthLevel,
      conversationHistory,
      requirementAreas,
      score,
      topicSummary,
      categoryCounts,
    } = body as {
      brief: string
      industry: string
      depthLevel: string
      conversationHistory: string
      requirementAreas: RequirementAreas
      score: number
      topicSummary?: string
      categoryCounts?: Record<string, number>
    }

    const safeBrief = asString(brief, 12000, true)
    const safeIndustry = asString(industry, 120)
    const safeDepth = asDepthLevel(depthLevel) || 'standard'
    const safeHistory = asString(conversationHistory, 40000)
    const safeTopicSummary = asString(topicSummary, 8000)
    if (!safeBrief) {
      return NextResponse.json({ error: 'Brief is required' }, { status: 400 })
    }

    const prompt = getQuestionerPrompt({
      brief: safeBrief,
      industry: safeIndustry || 'Not specified',
      depthLevel: safeDepth,
      conversationHistory: safeHistory || 'No conversation yet. This is the first message.',
      requirementAreas: requirementAreas || {},
      score: score || 0,
      topicSummary: safeTopicSummary || '',
      categoryCounts: categoryCounts || {},
    })
    // Try up to 2 times — a truncated response on the first attempt may succeed on retry
    const MAX_ATTEMPTS = 2
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const responseText = await generateForChat(SYSTEM_PROMPT, prompt)
      const parsed = parseAIResponse(responseText)

      if (!parsed) {
        if (attempt < MAX_ATTEMPTS) {
          continue
        }
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        )
      }

      if (!isSafeAIChatResponse(parsed)) {
        if (attempt < MAX_ATTEMPTS) {
          continue
        }
        return NextResponse.json(
          { error: 'AI response failed validation' },
          { status: 500 }
        )
      }

      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isRateLimit =
      (error instanceof Error && /429|quota|rate limit/i.test(message)) ||
      (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429)
    if (isRateLimit) {
      return NextResponse.json(
        { error: 'AI is at capacity. Please try again in a minute.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
