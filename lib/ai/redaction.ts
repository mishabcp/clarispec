import 'server-only'

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9]{20,}\b/g, // OpenAI-style API keys
  /\bAIza[0-9A-Za-z\-_]{20,}\b/g, // Google-style API keys
  /\b(?:gsk|rk)_[A-Za-z0-9]{20,}\b/g, // Generic prefixed keys
  /\beyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}\b/g, // JWTs
  /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{6,}/gi,
]

export function redactSensitivePromptInput(value: string): string {
  let out = value
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[REDACTED_SECRET]')
  }
  return out
}
