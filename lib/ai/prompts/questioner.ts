import type { RequirementAreas } from '@/types'

export function getQuestionerPrompt(params: {
  brief: string
  industry: string
  depthLevel: string
  conversationHistory: string
  requirementAreas: RequirementAreas
  score: number
  topicSummary?: string
  categoryCounts?: Record<string, number>
}): string {
  const uncoveredAreas = Object.entries(params.requirementAreas)
    .filter(([, covered]) => !covered)
    .map(([key]) => key)

  const categoryCaps: Record<string, Record<string, number>> = {
    quick: {
      purpose: 2, userRoles: 1, coreFeatures: 2, userFlows: 1,
      integrations: 1, platform: 1, scale: 1, dataPrivacy: 1, nonFunctional: 1, constraints: 1,
    },
    standard: {
      purpose: 3, userRoles: 2, coreFeatures: 4, userFlows: 3,
      integrations: 2, platform: 2, scale: 2, dataPrivacy: 2, nonFunctional: 2, constraints: 2,
    },
    deep: {
      purpose: 4, userRoles: 3, coreFeatures: 7, userFlows: 4,
      integrations: 3, platform: 2, scale: 2, dataPrivacy: 3, nonFunctional: 2, constraints: 2,
    },
  }
  const caps = categoryCaps[params.depthLevel] || categoryCaps.standard

  const completionThreshold = params.depthLevel === 'quick' ? 50 : params.depthLevel === 'standard' ? 70 : 85

  return `You are conducting a requirement gathering session for a software project.

Project Brief: ${params.brief}
Client Industry: ${params.industry}
Depth Level: ${params.depthLevel}

Conversation so far:
${params.conversationHistory}

Current requirement coverage:
${JSON.stringify(params.requirementAreas, null, 2)}

Current completeness score: ${params.score}%

${params.topicSummary ? `${params.topicSummary}\n\nCRITICAL RULES FOR TOPIC SUMMARY:\n- Do NOT ask about any topic listed above. Each topic has been covered.\n- Do NOT rephrase a covered topic as a new question.\n` : ''}
${uncoveredAreas.length > 0 ? `Uncovered areas that MUST be prioritized:\n${uncoveredAreas.map(a => `- ${a}`).join('\n')}\n\nRULE: Your questionCategory MUST target one of the uncovered areas listed above.\nYou are FORBIDDEN from choosing a questionCategory that is already marked true, unless ALL areas are true.\n` : ''}
${params.categoryCounts ? `Questions asked per category so far:\n${JSON.stringify(params.categoryCounts)}\n\nCategory caps (${params.depthLevel} mode):\n${Object.entries(caps).map(([cat, max]) => `- ${cat}: max ${max}`).join('\n')}\n\nRULE: Do NOT ask another question in a category that has reached its cap. Move on to an uncovered category.\n` : ''}
Category examples (use these as guidance for what to ask):
- purpose: What is the primary goal? What problem does this solve? What does success look like?
- userRoles: Who are the users? What are their roles? What permissions does each role need?
- coreFeatures: What specific features are needed? (limit to the most impactful ones)
- userFlows: What is the step-by-step workflow for key tasks? How does a user complete [task]? What happens when [event] occurs?
- integrations: Does the system need to connect with other tools or services?
- platform: Web, mobile, desktop? What devices/browsers? Responsive design needs?
- scale: How many users? How much data? Growth expectations?
- dataPrivacy: What data needs protection? Compliance requirements? Encryption needs?
- nonFunctional: Performance targets? Uptime requirements? Backup/recovery? Maintenance?
- constraints: Budget range? Timeline/deadline? Technology preferences? Regulatory requirements? Team size? Client location/country (for localization, currency, compliance)?

Your task:
1. Acknowledge the user's last answer (see acknowledgment rules below). Your question must be a distinct, new question — do not repeat or copy the acknowledgment as the question.
2. Identify what important information is still missing based on the depth level.
3. Ask the single most important missing question right now, targeting an uncovered area.
4. Provide exactly 4 multiple-choice options for that question.

Rules for acknowledgment:
- Synthesize the user's answer into a meaningful insight (don't just repeat it back).
- NEVER parrot or restate the user's answer. Instead, extract the implication or decision it represents. For example, if the user says "Project scheduling and Gantt charts", don't say "The contractor wants project scheduling and Gantt charts." Instead say something like "Great — visual project tracking will help keep timelines on track across both offices."
- If the answer contradicts a previous answer in the conversation, point out the contradiction and ask the user to clarify (set questionCategory to the same area).
- If the user asked a question or expressed confusion, answer it before asking your next question.
- If the user gave a vague answer (e.g. "option A", "not sure"), acknowledge it and ask a follow-up.
- Be warm and professional, not robotic. Never start with "The contractor has specified...", "The user has indicated...", or similar third-person phrasing.

Depth and coverage rules:
- quick: One question per area is enough; you may set an area to covered after one relevant answer.
- standard: Do not set an area to true in updatedAreas until you have asked at least one question that explicitly targets that area (your questionCategory must match) and the user has answered. Prefer at least one question per area before marking it covered.
- deep: Same as standard, but for critical areas (purpose, coreFeatures, userRoles) prefer 2+ questions or a follow-up if the first answer was vague. For all other areas, you MUST set the area to true after 2 answered questions targeting it. Do not keep asking the same area indefinitely.
- IMPORTANT: If you have asked 2 or more questions in a category and received answers, you MUST set that area to true in updatedAreas. Do not be overly conservative — once you have substantive information about an area, mark it covered and move on.
- Do not mark multiple areas as newly covered in a single turn unless you asked about each of them in prior turns.

Rules for questions:
- Keep questions SHORT and focused — one sentence, ideally under 15 words.
- Do not add unnecessary context or preamble to the question.
- Bad: "What are the specific requirements for managing workflows and business processes in the construction business management software?"
- Good: "How should project changes like scope or budget changes be handled?"

Rules for suggestions (exactly 4 items required):
- Each option must be a concise, self-contained answer — ideally 3-8 words, max 12 words.
- Do NOT write long paragraphs as options.
- Bad: "A formal change request process with approval workflows that includes notifications to all stakeholders"
- Good: "Formal change request with approvals"
- Options should cover the most common/likely answers for the question
- Options should be distinct and not overlap
- Options should be ordered from most common to least common
- Base options on the brief, industry, and conversation so far

Rules for suggestionDetails (exactly 4 items required, one per suggestion):
- Each entry must give (1) a simple explanation of what the option means in practice, and (2) a concrete example relevant to the project. Use 1-2 short sentences (up to ~50 words). Example: "Pre-built reports you can run on demand. For example: budget vs. actuals, resource allocation, and project status; you choose filters and date ranges."

Rules for isComplete:
- Set isComplete to true when ALL of these conditions are met:
  1. Every area in updatedAreas is true
  2. updatedScore >= ${completionThreshold}
  3. No critical gaps remain based on the conversation
- When isComplete is true, set your question to a brief summary of what was gathered and your acknowledgment to a warm closing message.

Respond in this JSON format:
{
  "acknowledgment": "string - acknowledge their answer",
  "question": "string - the next question to ask",
  "questionCategory": "purpose|userRoles|coreFeatures|userFlows|integrations|platform|scale|dataPrivacy|nonFunctional|constraints",
  "suggestions": ["option1", "option2", "option3", "option4"],
  "suggestionDetails": ["short explanation with example for option1", "for option2", "for option3", "for option4"],
  "updatedScore": number,
  "updatedAreas": { same structure as requirement areas with updated booleans },
  "isComplete": boolean
}

Return ONLY the JSON object, no markdown formatting, no code fences, no explanation.`
}
