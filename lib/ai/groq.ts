import 'server-only'
import Groq from 'groq-sdk'
import { RateLimitError } from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const MODEL = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'

export interface GenerateTextOptions {
  maxTokens: number
  temperature: number
}

/**
 * Call Groq chat completions with system + user prompt. Returns plain text.
 * Throws RateLimitError (from groq-sdk) on 429 for fallback handling.
 */
export async function generateWithGroq(
  system: string,
  prompt: string,
  opts: GenerateTextOptions
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
  })

  const choice = completion.choices[0]
  const content = choice?.message?.content
  if (content == null) {
    throw new Error('Groq returned no content')
  }
  if (choice.finish_reason === 'length') {
    console.warn(`[Groq] Response truncated (finish_reason=length). Output tokens maxed at ${opts.maxTokens}. Response length: ${content.length} chars`)
  }
  return content
}

export function isGroqRateLimitError(err: unknown): boolean {
  if (err instanceof RateLimitError) return true
  if (err && typeof err === 'object' && 'status' in err) {
    return (err as { status?: number }).status === 429
  }
  if (err instanceof Error && /429|rate limit/i.test(err.message)) return true
  return false
}
