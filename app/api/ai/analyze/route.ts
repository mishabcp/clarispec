import { NextResponse } from 'next/server'
import { generateForChat } from '@/lib/ai/provider'
import { getAnalyzerPrompt } from '@/lib/ai/prompts/analyzer'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system'
import { parseAIResponse } from '@/lib/ai/conversation'

export async function POST(request: Request) {
  try {
    const { brief, projectName, clientIndustry } = await request.json()

    if (!brief) {
      return NextResponse.json({ error: 'Brief is required' }, { status: 400 })
    }

    const prompt = getAnalyzerPrompt(brief)
    const responseText = await generateForChat(SYSTEM_PROMPT, prompt)
    const parsed = parseAIResponse(responseText)

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isRateLimit =
      (error instanceof Error && /429|quota|rate limit/i.test(message)) ||
      (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429)
    if (isRateLimit) {
      console.warn('AI Analyze rate-limited:', message.substring(0, 200))
      return NextResponse.json(
        { error: 'AI is at capacity. Please try again in a minute.' },
        { status: 429 }
      )
    }
    console.error('AI Analyze error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
