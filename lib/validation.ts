import { DOCUMENT_TYPES, type DepthLevel, type DocumentType, type MessageType } from '@/types'

const DEPTH_LEVELS: DepthLevel[] = ['quick', 'standard', 'deep']
const MESSAGE_TYPES: MessageType[] = ['chat', 'question', 'suggestion', 'summary', 'system']
const DOCUMENT_TYPE_SET = new Set(DOCUMENT_TYPES.map((d) => d.type))

export function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function asString(value: unknown, maxLen: number, required = false): string | null {
  if (value == null || value === '') return required ? null : ''
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (required && trimmed.length === 0) return null
  if (trimmed.length > maxLen) return null
  return trimmed
}

export function asDepthLevel(value: unknown): DepthLevel | null {
  if (typeof value !== 'string') return null
  return DEPTH_LEVELS.includes(value as DepthLevel) ? (value as DepthLevel) : null
}

export function asMessageType(value: unknown): MessageType | null {
  if (typeof value !== 'string') return null
  return MESSAGE_TYPES.includes(value as MessageType) ? (value as MessageType) : null
}

export function asDocumentType(value: unknown): DocumentType | null {
  if (typeof value !== 'string') return null
  return DOCUMENT_TYPE_SET.has(value as DocumentType) ? (value as DocumentType) : null
}

export function asVersion(value: unknown): number | null {
  if (value == null) return 1
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value < 1 || value > 1000) return null
  return value
}

export function isSafeAIChatResponse(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  const question = obj.question
  const suggestions = obj.suggestions
  if (typeof question !== 'string' || question.trim().length === 0 || question.length > 2000) return false
  if (!Array.isArray(suggestions) || suggestions.length === 0 || suggestions.length > 8) return false
  for (const s of suggestions) {
    if (typeof s !== 'string' || s.trim().length === 0 || s.length > 500) return false
  }
  return true
}
