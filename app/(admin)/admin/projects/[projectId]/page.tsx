'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Circle, Loader2, Bot, User, FileText } from 'lucide-react'

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

export default function AdminProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMessages, setShowMessages] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { project, owner, messages, areas, documents } = data
  const userMsgCount = messages.filter(m => m.role === 'user').length
  const aiMsgCount = messages.filter(m => m.role === 'assistant').length
  const questionCount = messages.filter(m => m.message_type === 'question').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/projects">
          <Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold font-heading">{project.name}</h1>
        <Badge variant={statusVariants[project.status] || 'secondary'} className="capitalize">{project.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project info */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Project Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-text-muted text-xs">Client</p><p className="font-medium">{project.client_name || '-'}</p></div>
            <div><p className="text-text-muted text-xs">Industry</p><p className="font-medium">{project.client_industry || '-'}</p></div>
            <div><p className="text-text-muted text-xs">Depth Level</p><p className="font-medium capitalize">{project.depth_level}</p></div>
            <div><p className="text-text-muted text-xs">Score</p><p className="font-medium">{project.requirement_score}%</p></div>
            <div><p className="text-text-muted text-xs">Created</p><p className="font-medium">{formatDate(project.created_at)}</p></div>
            <div><p className="text-text-muted text-xs">Updated</p><p className="font-medium">{formatDate(project.updated_at)}</p></div>
          </div>
          <div>
            <p className="text-text-muted text-xs mb-1">Initial Brief</p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap bg-surface-hover rounded-lg p-3">{project.initial_brief}</p>
          </div>
        </div>

        {/* Owner info */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Owner</h3>
          <div className="space-y-2 text-sm">
            <div><p className="text-text-muted text-xs">Name</p><p className="font-medium">{owner.full_name || '-'}</p></div>
            <div><p className="text-text-muted text-xs">Email</p><p className="font-medium">{owner.email || '-'}</p></div>
            <div><p className="text-text-muted text-xs">Company</p><p className="font-medium">{owner.company_name || '-'}</p></div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-medium text-text-muted mb-2">Session Stats</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Questions</span><span className="font-medium">{questionCount}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">User Messages</span><span className="font-medium">{userMsgCount}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">AI Responses</span><span className="font-medium">{aiMsgCount}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Total Messages</span><span className="font-medium">{messages.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirement areas */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Requirement Areas</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {areas.map((area) => (
            <div key={area.area_name} className="flex items-center gap-2 text-sm">
              {area.is_covered ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-text-muted shrink-0" />
              )}
              <span className={area.is_covered ? 'text-text-primary' : 'text-text-muted'}>
                {area.area_name}
              </span>
              {area.coverage_score > 0 && (
                <span className="text-xs text-text-muted">({area.coverage_score}%)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Documents ({documents.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-text-primary">{doc.title}</span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{doc.content}</p>
                <p className="text-[10px] text-text-muted mt-2">{formatDate(doc.generated_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Conversation ({messages.length} messages)</h3>
          <Button size="sm" variant="ghost" onClick={() => setShowMessages(!showMessages)}>
            {showMessages ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showMessages && (
          <div className="max-h-[500px] overflow-y-auto p-5 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 mt-0.5 rounded-full p-1 ${msg.role === 'user' ? 'bg-primary/20' : 'bg-accent/20'}`}>
                    {msg.role === 'user' ? <User className="h-3 w-3 text-primary" /> : <Bot className="h-3 w-3 text-accent" />}
                  </div>
                  <div>
                    <p className={`text-sm whitespace-pre-wrap rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-surface-hover text-text-primary'
                    }`}>
                      {msg.content}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5 px-1">
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
