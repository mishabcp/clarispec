export function getBRDPrompt(projectName: string, clientName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following software requirement gathering conversation, generate a complete
Business Requirements Document (BRD) in Markdown format.

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

Generate a professional BRD with these sections:
1. Executive Summary
2. Business Objectives
3. Project Scope
4. Stakeholders
5. Business Requirements (functional)
6. Assumptions and Constraints
7. Success Metrics / KPIs
8. Out of Scope

Use professional language. Be specific. Use tables where appropriate.
Format in clean Markdown. Do not wrap the output in code fences.`
}
