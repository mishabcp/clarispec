export function getDocumentEditPrompt(params: {
  documentContent: string
  instruction: string
  selectedText?: string
  documentType: string
}): { system: string; user: string } {
  const selectionClause = params.selectedText
    ? `\n\nThe user has selected this specific text to focus on:\n"""\n${params.selectedText}\n"""\n\nOnly modify the section containing or closely related to this selected text. Leave everything else exactly as-is.`
    : ''

  const system = `You are a professional technical document editor. You receive a markdown document and an editing instruction. Your job is to apply the requested change and return the COMPLETE updated document.

CRITICAL RULES:
1. Return the FULL document — every line, from start to finish. Do NOT return a partial document, a diff, or just the changed section.
2. Only modify what the instruction asks for. Every line that is not affected by the instruction must remain BYTE-FOR-BYTE identical — same whitespace, same punctuation, same formatting.
3. Maintain the existing markdown structure, heading levels, list styles, and formatting conventions.
4. Do not add commentary, explanations, or code fences around the output. Return ONLY the raw markdown content.
5. Do not add or remove markdown headings unless the instruction explicitly asks for structural changes.
6. If the instruction is ambiguous, make the most reasonable interpretation and apply it conservatively.

Document type: ${params.documentType}`

  const user = `Here is the current document:

"""
${params.documentContent}
"""
${selectionClause}

Instruction: ${params.instruction}

Return the complete updated document below (raw markdown only, no code fences, no explanation):`

  return { system, user }
}
