export function getAnalyzerPrompt(brief: string): string {
  return `Analyze the following software project brief and return a JSON object with this structure:

{
  "detectedIndustry": string,
  "softwareType": "web" | "mobile" | "both" | "desktop" | "unknown",
  "knownFeatures": string[],
  "identifiedUserTypes": string[],
  "gapsDetected": string[],
  "suggestedFirstQuestion": string,
  "suggestedFirstOptions": ["option1", "option2", "option3", "option4"],
  "suggestedFirstOptionDetails": ["short explanation with example for option1", "for option2", "for option3", "for option4"],
  "conversationPlan": string[],
  "initialRequirementAreas": {
    "purpose": boolean,
    "userRoles": boolean,
    "coreFeatures": boolean,
    "userFlows": boolean,
    "integrations": boolean,
    "platform": boolean,
    "scale": boolean,
    "dataPrivacy": boolean,
    "nonFunctional": boolean,
    "constraints": boolean
  },
  "initialScore": number
}

Rules:
- Set every key in initialRequirementAreas to false. Set initialScore to 0. Coverage will be updated only after the user answers questions during the gathering session.

Rules for suggestedFirstQuestion and suggestedFirstOptions:
- suggestedFirstQuestion must be phrased as a clear multiple-choice prompt (e.g. "What is the primary goal of this project?").
- suggestedFirstOptions must contain exactly 4 options. Each option must be a complete, self-contained answer (not just a keyword). Base options on the brief, detected industry, and common patterns for that type of software. Options should be distinct, cover the most likely answers, and be ordered from most common to least common.

Rules for suggestedFirstOptionDetails (exactly 4 items, one per option):
- Each entry must give (1) a simple explanation of what the option means in practice, and (2) a concrete example relevant to the brief. Use 1-2 short sentences (up to ~50 words).

Brief: ${brief}

Return ONLY the JSON object, no markdown formatting, no code fences, no explanation.`
}
