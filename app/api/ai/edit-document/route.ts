import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGroq } from '@/lib/ai/groq'
import { getDocumentEditPrompt } from '@/lib/ai/prompts/editDocument'
import { checkRateLimit, getClientIp, isSameOrigin } from '@/lib/security'
import { asObject, asString } from '@/lib/validation'
import { redactSensitivePromptInput } from '@/lib/ai/redaction'
import { runTimedApiRoute } from '@/lib/perf-log/timed-api'

export async function POST(request: Request) {
  return runTimedApiRoute('POST /api/ai/edit-document', 'POST', request, async () => {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    const raw = await request.json()
    const body = asObject(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const documentContent = asString(body.documentContent, 100000, true)
    const instruction = asString(body.instruction, 4000, true)
    const selectedText = asString(body.selectedText, 20000)
    const documentType = asString(body.documentType, 80) || 'document'

    if (!documentContent || !instruction) {
      return NextResponse.json(
        { error: 'documentContent and instruction are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`ai-edit:${user.id}:${ip}`, 20, 60 * 1000))) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    const { system, user: userPrompt } = getDocumentEditPrompt({
      documentContent,
      instruction,
      selectedText: selectedText ?? undefined,
      documentType: documentType || 'document',
    })

    const result = await generateWithGroq(
      redactSensitivePromptInput(system),
      redactSensitivePromptInput(userPrompt),
      {
      maxTokens: 8192,
      temperature: 0.3,
      }
    )

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

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  })
}
