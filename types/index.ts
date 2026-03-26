export type DepthLevel = 'quick' | 'standard' | 'deep'

export type ProjectStatus = 'gathering' | 'completed' | 'archived'

export type MessageRole = 'user' | 'assistant'

export type MessageType = 'chat' | 'question' | 'suggestion' | 'summary' | 'system'

export type DocumentType =
  | 'brd'
  | 'srs'
  | 'user_stories'
  | 'architecture_overview'
  | 'workflow'
  | 'mvp_scope'
  | 'feature_list'
  | 'timeline'

export interface Profile {
  id: string
  full_name: string | null
  company_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  client_name: string | null
  client_industry: string | null
  initial_brief: string
  status: ProjectStatus
  depth_level: DepthLevel
  requirement_score: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  project_id: string
  role: MessageRole
  content: string
  message_type: MessageType
  metadata: Record<string, unknown>
  created_at: string
}

export interface RequirementArea {
  id: string
  project_id: string
  area_name: string
  is_covered: boolean
  coverage_score: number
  notes: string | null
  updated_at: string
}

export interface Document {
  id: string
  project_id: string
  doc_type: DocumentType
  title: string
  content: string
  version: number
  is_edited: boolean
  generated_at: string
  updated_at: string
}

export interface DocumentSelection {
  id: string
  project_id: string
  doc_type: DocumentType
  is_selected: boolean
}

export interface RequirementAreas {
  purpose: boolean
  userRoles: boolean
  coreFeatures: boolean
  userFlows: boolean
  integrations: boolean
  platform: boolean
  scale: boolean
  dataPrivacy: boolean
  nonFunctional: boolean
  constraints: boolean
}

export interface BriefAnalysis {
  detectedIndustry: string
  softwareType: 'web' | 'mobile' | 'both' | 'desktop' | 'unknown'
  knownFeatures: string[]
  identifiedUserTypes: string[]
  gapsDetected: string[]
  suggestedFirstQuestion: string
  suggestedFirstOptions: string[]
  suggestedFirstOptionDetails?: string[]
  conversationPlan: string[]
  initialRequirementAreas: RequirementAreas
  initialScore: number
}

export interface AIResponse {
  acknowledgment: string
  question: string
  questionCategory: keyof RequirementAreas
  suggestions: string[]
  suggestionDetails?: string[]
  updatedScore: number
  updatedAreas: RequirementAreas
  isComplete: boolean
}

export const DOCUMENT_TYPES: { type: DocumentType; title: string; description: string }[] = [
  { type: 'brd', title: 'Business Requirements Document', description: 'Business goals, stakeholders, scope, success metrics' },
  { type: 'srs', title: 'Software Requirements Specification', description: 'Detailed functional & non-functional requirements' },
  { type: 'user_stories', title: 'User Stories', description: 'User stories with acceptance criteria' },
  { type: 'architecture_overview', title: 'Software Architecture Overview', description: 'High-level system design, components, suggested tech stack' },
  { type: 'workflow', title: 'Workflow Document', description: 'Step-by-step process flows for key features' },
  { type: 'mvp_scope', title: 'MVP Scope Document', description: 'Core vs. future features, Phase 1 scope definition' },
  { type: 'feature_list', title: 'Feature List (MoSCoW)', description: 'Must/Should/Could/Won\'t have prioritization' },
  { type: 'timeline', title: 'Project Timeline Estimate', description: 'Rough phases, milestones, time estimates' },
]

export const INDUSTRIES = [
  'E-commerce',
  'Healthcare',
  'Fintech',
  'Education',
  'Real Estate',
  'Logistics',
  'Social Media',
  'SaaS / B2B Tool',
  'Entertainment',
  'Government',
  'Other',
] as const

export const REQUIREMENT_AREA_LABELS: Record<keyof RequirementAreas, { label: string; weight: number }> = {
  purpose: { label: 'Purpose & Goals', weight: 15 },
  userRoles: { label: 'User Roles', weight: 10 },
  coreFeatures: { label: 'Core Features', weight: 20 },
  userFlows: { label: 'User Flows', weight: 15 },
  integrations: { label: 'Integrations', weight: 10 },
  platform: { label: 'Platform', weight: 5 },
  scale: { label: 'Scale & Performance', weight: 5 },
  dataPrivacy: { label: 'Data & Privacy', weight: 10 },
  nonFunctional: { label: 'Non-functional Requirements', weight: 5 },
  constraints: { label: 'Constraints & Preferences', weight: 5 },
}

export const DEPTH_THRESHOLDS: Record<DepthLevel, number> = {
  quick: 50,
  standard: 70,
  deep: 85,
}
