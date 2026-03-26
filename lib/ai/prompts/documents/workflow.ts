export function getWorkflowPrompt(projectName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate a
Workflow Document describing the key process flows of the software.

Project: ${projectName}
Industry: ${industry}
${initialBrief ? `Initial Brief: ${initialBrief}\n` : ''}
Conversation:
${conversationHistory}

Context instructions:
- Extract the client's location/country/region from the conversation and brief. If a location is identified, apply the relevant local context throughout the document: local currency, tax system, regulatory requirements, industry standards, and compliance frameworks applicable to that region.
- If there are contradictions in the conversation (e.g., user said "no document management" then later said "basic file sharing"), note the contradiction and use the latest answer as the requirement.
- Reference the initial brief for context that may not appear in the trimmed conversation history.

For each major user flow / process, describe it in this format:

## [Flow Name]
**Actors:** [who is involved]
**Trigger:** [what starts this flow]
**Preconditions:** [what must be true before this starts]

**Steps:**
1. Step description
2. Step description
...

**Postconditions:** [what is true after this flow completes]
**Alternative Flows:** [what happens if something goes wrong or user takes a different path]

Cover all major flows identified in the requirements.
Format in clean Markdown. Do not wrap the output in code fences.`
}
