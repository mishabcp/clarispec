import { NextResponse } from 'next/server'
import { generateForChat } from '@/lib/ai/provider'
import { getQuestionerPrompt } from '@/lib/ai/prompts/questioner'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system'
import { parseAIResponse } from '@/lib/ai/conversation'
import type { RequirementAreas } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
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

    if (!brief) {
      return NextResponse.json({ error: 'Brief is required' }, { status: 400 })
    }

    const prompt = getQuestionerPrompt({
      brief,
      industry: industry || 'Not specified',
      depthLevel: depthLevel || 'standard',
      conversationHistory: conversationHistory || 'No conversation yet. This is the first message.',
      requirementAreas: requirementAreas || {},
      score: score || 0,
      topicSummary: topicSummary || '',
      categoryCounts: categoryCounts || {},
    })
    console.log(`[Clarispec AI Chat] Prompt size: ${prompt.length} chars, conversation history: ${(conversationHistory || '').length} chars`)

    // Try up to 2 times — a truncated response on the first attempt may succeed on retry
    const MAX_ATTEMPTS = 2
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const responseText = await generateForChat(SYSTEM_PROMPT, prompt)
      console.log(`[Clarispec AI Chat] Attempt ${attempt} raw response (first 500 chars):`, responseText.substring(0, 500))
      const parsed = parseAIResponse(responseText)

      if (!parsed) {
        console.warn(`[Clarispec AI Chat] Attempt ${attempt}: failed to parse. Response length: ${responseText.length} chars`)
        if (attempt < MAX_ATTEMPTS) {
          console.warn('[Clarispec AI Chat] Retrying...')
          continue
        }
        console.error('[Clarispec AI Chat] All attempts failed. Full text:', responseText)
        return NextResponse.json(
          { error: 'Failed to parse AI response', raw: responseText },
          { status: 500 }
        )
      }

      if (!parsed.question || !parsed.suggestions) {
        console.warn('[Clarispec AI Chat] AI response missing required fields:', Object.keys(parsed))
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
      console.warn('[Clarispec AI Chat] Rate-limited:', message.substring(0, 200))
      return NextResponse.json(
        { error: 'AI is at capacity. Please try again in a minute.' },
        { status: 429 }
      )
    }
    // Log full error details so we can diagnose next time
    console.error('[Clarispec AI Chat] Error reason:', message)
    if (error instanceof Error) {
      console.error('[Clarispec AI Chat] Error name:', error.name)
      if (error.stack) console.error('[Clarispec AI Chat] Stack:', error.stack)
      if ('cause' in error && error.cause) console.error('[Clarispec AI Chat] Cause:', error.cause)
    } else {
      console.error('[Clarispec AI Chat] Raw error (not Error instance):', JSON.stringify(error, null, 2))
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
