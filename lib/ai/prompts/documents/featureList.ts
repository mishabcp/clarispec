export function getFeatureListPrompt(projectName: string, industry: string, conversationHistory: string, initialBrief: string = ''): string {
  return `Based on the following requirement gathering conversation, generate a complete
Feature List using the MoSCoW prioritization method in Markdown format.

Project: ${projectName}
Industry: ${industry}
${initialBrief ? `Initial Brief: ${initialBrief}\n` : ''}
Conversation:
${conversationHistory}

Context instructions:
- Extract the client's location/country/region from the conversation and brief. If a location is identified, apply the relevant local context throughout the document: local currency, tax system, regulatory requirements, industry standards, and compliance frameworks applicable to that region.
- If there are contradictions in the conversation (e.g., user said "no document management" then later said "basic file sharing"), note the contradiction and use the latest answer as the requirement.
- Reference the initial brief for context that may not appear in the trimmed conversation history.

Generate a comprehensive feature list with all features categorized as:
- **Must Have** — Critical features without which the product doesn't work
- **Should Have** — Important features that add significant value
- **Could Have** — Nice-to-have features if time/budget allows
- **Won't Have (this time)** — Explicitly out of scope for now

For each feature include:
| Feature | Category | Description | Rationale |

Also include:
- Summary count of features per category
- Notes on dependencies between features

Format in clean Markdown with tables. Do not wrap the output in code fences.`
}
