import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGroq } from '@/lib/ai/groq'
import { getDocumentEditPrompt } from '@/lib/ai/prompts/editDocument'

export async function POST(request: Request) {
  try {
    const { documentContent, instruction, selectedText, documentType } = await request.json() as {
      documentContent: string
      instruction: string
      selectedText?: string
      documentType: string
    }

    if (!documentContent || !instruction) {
      return NextResponse.json(
        { error: 'documentContent and instruction are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { system, user: userPrompt } = getDocumentEditPrompt({
      documentContent,
      instruction,
      selectedText,
      documentType: documentType || 'document',
    })

    const result = await generateWithGroq(system, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
    })

    const cleaned = result
      .replace(/^```(?:markdown|md)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()

    return NextResponse.json({ content: cleaned })
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

    console.error('Document edit error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
