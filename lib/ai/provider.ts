import { generateWithGroq, isGroqRateLimitError } from '@/lib/ai/groq'
import { generateWithGemini } from '@/lib/ai/gemini'
import { redactSensitivePromptInput } from '@/lib/ai/redaction'

export interface GenerateTextOptions {
  maxTokens: number
  temperature: number
}

/**
 * Generate text using Groq as primary; on 429 rate limit, fall back to Gemini.
 * If GROQ_API_KEY is not set, uses Gemini only.
 */
export async function generateText(
  system: string,
  prompt: string,
  opts: GenerateTextOptions
): Promise<string> {
  const safeSystem = redactSensitivePromptInput(system)
  const safePrompt = redactSensitivePromptInput(prompt)
  const useGroq = Boolean(process.env.GROQ_API_KEY)

  if (!useGroq) {
    return generateWithGemini(safeSystem, safePrompt, opts)
  }

  try {
    return await generateWithGroq(safeSystem, safePrompt, opts)
  } catch (err) {
    if (isGroqRateLimitError(err)) {
      console.warn('[AI Fallback] Groq rate-limited, falling back to Gemini')
      return await generateWithGemini(safeSystem, safePrompt, opts)
    }
    throw err
  }
}

/** Chat/analyze: temp 0.7, max 8192 tokens (enough for question + 4 options + suggestionDetails) */
export async function generateForChat(system: string, prompt: string): Promise<string> {
  return generateText(system, prompt, {
    temperature: 0.7,
    maxTokens: 8192,
  })
}

/** Document generation: temp 0.5, max 8192 tokens */
export async function generateForDocs(system: string, prompt: string): Promise<string> {
  return generateText(system, prompt, {
    temperature: 0.5,
    maxTokens: 8192,
  })
}
