export function getMVPScopePrompt(projectName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate an
MVP (Minimum Viable Product) Scope Document in Markdown format.

Project: ${projectName}
Industry: ${industry}
${initialBrief ? `Initial Brief: ${initialBrief}\n` : ''}
Conversation:
${conversationHistory}

Context instructions:
- Extract the client's location/country/region from the conversation and brief. If a location is identified, apply the relevant local context throughout the document: local currency, tax system, regulatory requirements, industry standards, and compliance frameworks applicable to that region.
- If there are contradictions in the conversation (e.g., user said "no document management" then later said "basic file sharing"), note the contradiction and use the latest answer as the requirement.
- Reference the initial brief for context that may not appear in the trimmed conversation history.

Generate the document with these sections:
1. MVP Definition (what is the MVP and its purpose)
2. MVP Goals (what must the MVP achieve)
3. Phase 1 — Core Scope (features included in MVP)
4. Phase 2 — Next Iteration (features for the next release)
5. Future Phases (long-term features)
6. Explicitly Out of Scope for MVP
7. MVP Success Criteria (how do we know the MVP succeeded)
8. Recommended MVP Timeline (rough estimate in weeks)

Be practical and realistic. Focus on the minimum needed to validate the core value.
Format in clean Markdown. Do not wrap the output in code fences.`
}
