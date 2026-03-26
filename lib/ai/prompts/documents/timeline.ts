export function getTimelinePrompt(projectName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate a
Project Timeline Estimate document in Markdown format.

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
1. Project Overview Summary
2. Estimated Phases with duration (in weeks):
   - Phase 1: Discovery & Design
   - Phase 2: Core Development (MVP)
   - Phase 3: Testing & QA
   - Phase 4: Deployment & Launch
   - Phase 5: Post-launch Support (optional)
3. Milestone Table: | Milestone | Deliverable | Estimated Week |
4. Key Dependencies and Risks
5. Total Estimated Duration
6. Important Assumptions behind the estimates

Note: These are rough estimates for planning purposes only.
Add a disclaimer that actual timelines depend on team size, technology choices, and scope changes.
Format in clean Markdown. Do not wrap the output in code fences.`
}
