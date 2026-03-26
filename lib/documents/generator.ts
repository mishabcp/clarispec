import { generateForDocs } from '@/lib/ai/provider'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system'
import { getBRDPrompt } from '@/lib/ai/prompts/documents/brd'
import { getSRSPrompt } from '@/lib/ai/prompts/documents/srs'
import { getUserStoriesPrompt } from '@/lib/ai/prompts/documents/userStories'
import { getArchitecturePrompt } from '@/lib/ai/prompts/documents/architecture'
import { getWorkflowPrompt } from '@/lib/ai/prompts/documents/workflow'
import { getMVPScopePrompt } from '@/lib/ai/prompts/documents/mvpScope'
import { getFeatureListPrompt } from '@/lib/ai/prompts/documents/featureList'
import { getTimelinePrompt } from '@/lib/ai/prompts/documents/timeline'
import type { DocumentType } from '@/types'
import { DOCUMENT_TYPES } from '@/types'
import { delay } from '@/lib/utils'

interface ProjectInfo {
  name: string
  clientName: string
  industry: string
  initialBrief?: string
}

function getPrompt(
  docType: DocumentType,
  project: ProjectInfo,
  conversationHistory: string
): string {
  const { name, clientName, industry, initialBrief } = project
  const brief = initialBrief || ''

  switch (docType) {
    case 'brd':
      return getBRDPrompt(name, clientName, industry, conversationHistory, brief)
    case 'srs':
      return getSRSPrompt(name, clientName, industry, conversationHistory, brief)
    case 'user_stories':
      return getUserStoriesPrompt(name, industry, conversationHistory, brief)
    case 'architecture_overview':
      return getArchitecturePrompt(name, industry, conversationHistory, brief)
    case 'workflow':
      return getWorkflowPrompt(name, industry, conversationHistory, brief)
    case 'mvp_scope':
      return getMVPScopePrompt(name, industry, conversationHistory, brief)
    case 'feature_list':
      return getFeatureListPrompt(name, industry, conversationHistory, brief)
    case 'timeline':
      return getTimelinePrompt(name, industry, conversationHistory, brief)
    default:
      throw new Error(`Unknown document type: ${docType}`)
  }
}

function getDocTitle(docType: DocumentType): string {
  return DOCUMENT_TYPES.find(d => d.type === docType)?.title || docType
}

export async function generateDocument(
  docType: DocumentType,
  project: ProjectInfo,
  conversationHistory: string
): Promise<{ title: string; content: string }> {
  const prompt = getPrompt(docType, project, conversationHistory)
  let content = await generateForDocs(SYSTEM_PROMPT, prompt)

  // Strip markdown code fences if present
  if (content.startsWith('```markdown')) {
    content = content.slice(11)
  }
  if (content.startsWith('```')) {
    content = content.slice(3)
  }
  if (content.endsWith('```')) {
    content = content.slice(0, -3)
  }

  return {
    title: getDocTitle(docType),
    content: content.trim(),
  }
}

export async function generateAllDocuments(
  selectedDocs: DocumentType[],
  project: ProjectInfo,
  conversationHistory: string
): Promise<{ docType: DocumentType; title: string; content: string }[]> {
  const results: { docType: DocumentType; title: string; content: string }[] = []

  for (const docType of selectedDocs) {
    const { title, content } = await generateDocument(docType, project, conversationHistory)
    results.push({ docType, title, content })
    await delay(1000) // Respect rate limits
  }

  return results
}
