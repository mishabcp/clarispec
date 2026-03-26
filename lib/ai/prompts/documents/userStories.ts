export function getUserStoriesPrompt(projectName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate comprehensive
User Stories in Markdown format.

Project: ${projectName}
Industry: ${industry}
${initialBrief ? `Initial Brief: ${initialBrief}\n` : ''}
Conversation:
${conversationHistory}

Context instructions:
- Extract the client's location/country/region from the conversation and brief. If a location is identified, apply the relevant local context throughout the document: local currency, tax system, regulatory requirements, industry standards, and compliance frameworks applicable to that region.
- If there are contradictions in the conversation (e.g., user said "no document management" then later said "basic file sharing"), note the contradiction and use the latest answer as the requirement.
- Reference the initial brief for context that may not appear in the trimmed conversation history.

For each identified user role, generate user stories in this format:
**Story ID: US-[number]**
**Title:** Short title
**As a** [user role],
**I want to** [feature/action],
**So that** [benefit/reason].

**Acceptance Criteria:**
- Given [context], when [action], then [expected result]
- (list all relevant criteria)

**Priority:** Must Have / Should Have / Could Have
**Complexity:** Low / Medium / High

Group stories by user role. Be thorough — cover all features mentioned.
Format in clean Markdown. Do not wrap the output in code fences.`
}
