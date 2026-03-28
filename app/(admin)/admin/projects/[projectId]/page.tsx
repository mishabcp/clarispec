'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Circle, Loader2, Bot, User, FileText } from 'lucide-react'

const glassPanel =
  'rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

/** ~6–8 lines of brief at typical width — expand/collapse beyond this */
const BRIEF_MAX_COLLAPSED_HEIGHT = 'max-h-40'

const CONVERSATION_PANEL_ID = 'admin-project-conversation-messages'

interface ProjectDetail {
  project: {
    id: string
    name: string
    client_name: string | null
    client_industry: string | null
    initial_brief: string
    status: string
    depth_level: string
    requirement_score: number
    created_at: string
    updated_at: string
  }
  owner: { id: string; full_name: string; company_name: string | null; email: string }
  messages: Array<{
    id: string
    role: string
    content: string
    message_type: string
    metadata: Record<string, unknown>
    created_at: string
  }>
  areas: Array<{
    area_name: string
    is_covered: boolean
    coverage_score: number
  }>
  documents: Array<{
    id: string
    doc_type: string
    title: string
    content: string
    version: number
    generated_at: string
  }>
}

const statusVariants: Record<string, 'warning' | 'success' | 'secondary'> = {
  gathering: 'warning',
  completed: 'success',
  archived: 'secondary',
}

function isProjectDetailPayload(x: unknown): x is ProjectDetail {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    o.project !== null &&
    typeof o.project === 'object' &&
    typeof (o.project as { id?: string }).id === 'string' &&
    Array.isArray(o.messages) &&
    Array.isArray(o.areas) &&
    Array.isArray(o.documents) &&
    o.owner !== null &&
    typeof o.owner === 'object'
  )
}

export default function AdminProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [showMessages, setShowMessages] = useState(false)
  const [briefExpanded, setBriefExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const res = await fetch(`/api/admin/projects/${projectId}`)
        let json: unknown
        try {
          json = await res.json()
        } catch {
          if (!cancelled) setError({ message: 'Invalid response from server' })
          return
        }
        if (cancelled) return

        if (!res.ok) {
          const msg =
            typeof json === 'object' &&
            json !== null &&
            'error' in json &&
            typeof (json as { error: unknown }).error === 'string'
              ? (json as { error: string }).error
              : res.status === 404
                ? 'Project not found'
                : 'Unable to load project'
          if (!cancelled) setError({ message: msg, status: res.status })
          return
        }

        if (!isProjectDetailPayload(json)) {
          if (!cancelled) setError({ message: 'Invalid project payload' })
          return
        }

        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError({ message: 'Network error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className={cn(glassPanel, 'p-8 text-center max-w-lg mx-auto')}>
          <p className="text-text-primary font-medium">{error?.message ?? 'Unable to load project'}</p>
          {error?.status === 404 && (
            <p className="text-sm text-text-secondary mt-2">Check the ID or return to the project list.</p>
          )}
          <Link
            href="/admin/projects"
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'mt-6 inline-flex')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to projects
          </Link>
        </div>
      </div>
    )
  }

  const { project, owner, messages, areas, documents } = data
  const userMsgCount = messages.filter((m) => m.role === 'user').length
  const aiMsgCount = messages.filter((m) => m.role === 'assistant').length
  const questionCount = messages.filter((m) => m.message_type === 'question').length

  const brief = project.initial_brief ?? ''
  const briefNeedsToggle = brief.length > 480

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/projects"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'focus-visible:ring-offset-[#0a0a0b]'
          )}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold font-heading">{project.name}</h1>
        <Badge variant={statusVariants[project.status] || 'secondary'} className="capitalize">
          {project.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cn('lg:col-span-2 p-5 space-y-4', glassPanel)}>
          <h3 className="text-sm font-semibold text-text-primary">Project Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs">Client</p>
              <p className="font-medium">{project.client_name || '-'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Industry</p>
              <p className="font-medium">{project.client_industry || '-'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Depth Level</p>
              <p className="font-medium capitalize">{project.depth_level}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Score</p>
              <p className="font-medium">{project.requirement_score}%</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Created</p>
              <p className="font-medium">{formatDate(project.created_at)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Updated</p>
              <p className="font-medium">{formatDate(project.updated_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-text-muted text-xs mb-1">Initial Brief</p>
            <div
              className={cn(
                'rounded-lg border border-white/[0.06] bg-white/[0.03] p-3',
                briefNeedsToggle && !briefExpanded && BRIEF_MAX_COLLAPSED_HEIGHT,
                briefNeedsToggle && !briefExpanded && 'overflow-hidden'
              )}
            >
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{brief}</p>
            </div>
            {briefNeedsToggle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-auto py-1 px-2 text-xs text-text-muted hover:text-text-primary"
                onClick={() => setBriefExpanded((e) => !e)}
              >
                {briefExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        </div>

        <div className={cn('p-5 space-y-4', glassPanel)}>
          <h3 className="text-sm font-semibold text-text-primary">Owner</h3>
          <p className="text-[11px] text-text-muted leading-snug">
            Contains PII — internal use only; do not share outside admin workflows.
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-text-muted text-xs">Name</p>
              <p className="font-medium">{owner.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Email</p>
              <p className="font-medium break-all">{owner.email || '-'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Company</p>
              <p className="font-medium">{owner.company_name || '-'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <h4 className="text-xs font-medium text-text-muted mb-2">Session Stats</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Questions</span>
                <span className="font-medium tabular-nums">{questionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">User Messages</span>
                <span className="font-medium tabular-nums">{userMsgCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">AI Responses</span>
                <span className="font-medium tabular-nums">{aiMsgCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total Messages</span>
                <span className="font-medium tabular-nums">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn('p-5', glassPanel)}>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Requirement Areas</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {areas.map((area) => (
            <div key={area.area_name} className="flex items-center gap-2 text-sm">
              {area.is_covered ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-text-muted shrink-0" />
              )}
              <span className={area.is_covered ? 'text-text-primary' : 'text-text-muted'}>{area.area_name}</span>
              {area.coverage_score > 0 && (
                <span className="text-xs text-text-muted tabular-nums">({area.coverage_score}%)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {documents.length > 0 && (
        <div className={cn('p-5', glassPanel)}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Documents ({documents.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/30 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-primary line-clamp-2">{doc.title}</span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{doc.content}</p>
                <p className="text-[11px] text-text-muted mt-2 tabular-nums">{formatDate(doc.generated_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn('overflow-hidden', glassPanel)}>
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary">Conversation ({messages.length} messages)</h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-expanded={showMessages}
            aria-controls={CONVERSATION_PANEL_ID}
            onClick={() => setShowMessages((s) => !s)}
          >
            {showMessages ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showMessages && (
          <div
            id={CONVERSATION_PANEL_ID}
            className="max-h-[500px] overflow-y-auto p-5 space-y-3 scrollbar-thin"
            role="region"
            aria-label="Project conversation messages"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : '')}>
                <div
                  className={cn(
                    'flex items-start gap-2 max-w-[80%]',
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'shrink-0 mt-0.5 rounded-full p-1',
                      msg.role === 'user' ? 'bg-primary/20' : 'bg-accent/20'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <User className="h-3 w-3 text-primary" aria-hidden />
                    ) : (
                      <Bot className="h-3 w-3 text-accent" aria-hidden />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm whitespace-pre-wrap rounded-lg px-3 py-2',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/[0.06] text-text-primary border border-white/[0.06]'
                      )}
                    >
                      {msg.content}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5 px-1 tabular-nums">
                      {msg.message_type !== 'chat' && <span className="mr-1">[{msg.message_type}]</span>}
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
