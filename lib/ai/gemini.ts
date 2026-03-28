import 'server-only'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export interface GenerateTextOptions {
  maxTokens: number
  temperature: number
}

/**
 * Call Gemini with system + user prompt. Returns plain text.
 * Used as fallback when Groq returns 429.
 */
export async function generateWithGemini(
  system: string,
  prompt: string,
  opts: GenerateTextOptions
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: opts.temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: opts.maxTokens,
    },
  })

  const result = await model.generateContent([
    { text: system },
    { text: prompt },
  ])
  return result.response.text()
}

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  })
}

export function getGeminiModelForDocs() {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  })
}
