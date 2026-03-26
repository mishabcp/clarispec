export function getSRSPrompt(projectName: string, clientName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate a complete
Software Requirements Specification (SRS) document in Markdown format.

Project: ${projectName}
Client: ${clientName}
Industry: ${industry}
${initialBrief ? `Initial Brief: ${initialBrief}\n` : ''}
Conversation:
${conversationHistory}

Context instructions:
- Extract the client's location/country/region from the conversation and brief. If a location is identified, apply the relevant local context throughout the document: local currency, tax system, regulatory requirements, industry standards, and compliance frameworks applicable to that region.
- If there are contradictions in the conversation (e.g., user said "no document management" then later said "basic file sharing"), note the contradiction and use the latest answer as the requirement.
- Reference the initial brief for context that may not appear in the trimmed conversation history.

Generate a professional SRS with these sections:
1. Introduction (Purpose, Scope, Definitions)
2. Overall Description (Product Perspective, User Classes, Assumptions)
3. Functional Requirements (detailed list, numbered)
4. Non-Functional Requirements (performance, security, reliability, scalability)
5. System Constraints
6. External Interface Requirements

Use IEEE SRS standard as a guide. Be specific and detailed.
Format in clean Markdown with numbered requirements. Do not wrap the output in code fences.`
}
