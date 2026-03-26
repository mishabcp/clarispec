export function getArchitecturePrompt(projectName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate a
Software Architecture Overview document in Markdown format.

This is a HIGH-LEVEL conceptual document for project managers — NOT for developers.
Avoid deep technical jargon. Explain technical choices in business terms.

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
1. System Overview (plain English description of how the system works)
2. Key Components (list the major parts of the system and what each does)
3. Suggested Technology Stack (with simple explanations of why each is recommended)
4. System Integrations (third-party services and why they're needed)
5. Security Considerations (key security needs in plain terms)
6. Scalability Considerations (how the system can grow)

Keep language accessible to non-technical stakeholders.
Format in clean Markdown. Do not wrap the output in code fences.`
}
