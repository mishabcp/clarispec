import type { Message, RequirementAreas } from '@/types'

/**
 * Format conversation history for prompt injection.
 * If maxChars is Infinity (or not finite), returns the full history untruncated.
 * Otherwise keeps the first 2 messages (context) and the most recent messages
 * that fit, separated by a trimmed marker.
 */
export function formatConversationHistory(messages: Message[], maxChars: number = 16000): string {
  const formatted = messages.map(
    (msg) => `${msg.role === 'user' ? 'PM' : 'AI'}: ${msg.content}`
  )

  const full = formatted.join('\n\n')
  if (!isFinite(maxChars) || full.length <= maxChars) return full

  const head = formatted.slice(0, 2)
  const headStr = head.join('\n\n')
  const marker = '\n\n[...earlier messages trimmed for brevity...]\n\n'
  const budget = maxChars - headStr.length - marker.length

  const tail: string[] = []
  let tailLen = 0
  for (let i = formatted.length - 1; i >= 2; i--) {
    const entry = formatted[i]
    if (tailLen + entry.length + 2 > budget) break
    tail.unshift(entry)
    tailLen += entry.length + 2
  }

  return headStr + marker + tail.join('\n\n')
}

/**
 * Build a compact topic summary from all question messages, grouped by category.
 * This never gets trimmed and serves as persistent memory of what was already asked.
 */
export function buildTopicSummary(messages: Message[]): string {
  const questions = messages.filter(
    (m) => m.role === 'assistant' && m.message_type === 'question'
  )
  if (questions.length === 0) return ''

  const byCategory: Record<string, string[]> = {}
  questions.forEach((q, idx) => {
    const cat = (q.metadata?.questionCategory as string) || 'unknown'
    const short = q.content.length > 60 ? q.content.substring(0, 57) + '...' : q.content
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(`Q${idx + 1}: ${short}`)
  })

  const lines = Object.entries(byCategory).map(
    ([cat, items]) => `- ${cat} (${items.length}): ${items.join('; ')}`
  )
  return `Already covered topics (DO NOT re-ask these):\n${lines.join('\n')}`
}

/**
 * Count how many questions have been asked per category.
 */
export function buildCategoryCounts(messages: Message[]): Record<string, number> {
  const counts: Record<string, number> = {}
  messages
    .filter((m) => m.role === 'assistant' && m.message_type === 'question')
    .forEach((q) => {
      const cat = (q.metadata?.questionCategory as string) || 'unknown'
      counts[cat] = (counts[cat] || 0) + 1
    })
  return counts
}

export function getDefaultRequirementAreas(): RequirementAreas {
  return {
    purpose: false,
    userRoles: false,
    coreFeatures: false,
    userFlows: false,
    integrations: false,
    platform: false,
    scale: false,
    dataPrivacy: false,
    nonFunctional: false,
    constraints: false,
  }
}

export function calculateScore(areas: RequirementAreas): number {
  const weights: Record<keyof RequirementAreas, number> = {
    purpose: 15,
    userRoles: 10,
    coreFeatures: 20,
    userFlows: 15,
    integrations: 10,
    platform: 5,
    scale: 5,
    dataPrivacy: 10,
    nonFunctional: 5,
    constraints: 5,
  }

  let score = 0
  for (const [key, covered] of Object.entries(areas)) {
    if (covered) {
      score += weights[key as keyof RequirementAreas]
    }
  }

  return score
}

/**
 * Try to repair truncated JSON (e.g. model hit token limit mid-response).
 * Strategy: find the last complete key-value pair, truncate there, then close braces/brackets.
 */
function tryRepairTruncatedJson(raw: string): string | null {
  let s = raw.trim()
  if (s.endsWith('}')) return s

  // Progressively strip from the end until JSON.parse succeeds:
  // This is brute-force but reliable — strip trailing chars up to 200 at a time,
  // try adding closing brackets/braces after each strip.
  for (let stripLen = 0; stripLen < Math.min(s.length, 600); stripLen++) {
    const candidate = s.slice(0, s.length - stripLen)

    // Find the last comma, colon, opening bracket/brace as a truncation point
    const lastSafe = Math.max(
      candidate.lastIndexOf(','),
      candidate.lastIndexOf('['),
      candidate.lastIndexOf('{')
    )
    if (lastSafe < 1) continue

    let attempt = candidate.slice(0, lastSafe)
    // Balance brackets and braces
    const openBraces = (attempt.match(/\{/g)?.length ?? 0) - (attempt.match(/\}/g)?.length ?? 0)
    const openBrackets = (attempt.match(/\[/g)?.length ?? 0) - (attempt.match(/\]/g)?.length ?? 0)
    for (let i = 0; i < openBrackets; i++) attempt += ']'
    for (let i = 0; i < openBraces; i++) attempt += '}'

    try {
      JSON.parse(attempt)
      return attempt
    } catch {
      // continue stripping
    }
  }
  return null
}

export function parseAIResponse(text: string): Record<string, unknown> | null {
  try {
    let cleaned = text.trim()

    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      cleaned = fenceMatch[1]
    }

    // Also handle cases where only opening/closing fences remain
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)

    cleaned = cleaned.trim()

    // Try to find JSON object if there's surrounding text
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
    }

    let parsed: unknown = null
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Response may be truncated (e.g. hit token limit); try to repair
      const repaired = tryRepairTruncatedJson(cleaned)
      if (!repaired) return null
      try {
        parsed = JSON.parse(repaired)
        console.warn('[Clarispec] Repaired truncated AI response — some fields may be missing')
      } catch {
        return null
      }
    }

    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
