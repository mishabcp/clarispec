'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Project } from '@/types'
import { MessageSquare, FileText, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'

const statusConfig = {
  gathering: { label: 'Gathering', variant: 'warning' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  archived: { label: 'Archived', variant: 'secondary' as const },
}

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const status = statusConfig[project.status]
  const [restarting, setRestarting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRestartGathering() {
    const confirmed = window.confirm(
      'This will clear all conversation, progress, and generated documents. You can start gathering again from the beginning. Continue?'
    )
    if (!confirmed) return

    setRestarting(true)
    try {
      const { error: documentsError } = await supabase
        .from('documents')
        .delete()
        .eq('project_id', project.id)

      if (documentsError) throw documentsError

      const { error: selectionsError } = await supabase
        .from('document_selections')
        .delete()
        .eq('project_id', project.id)

      if (selectionsError) throw selectionsError

      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('project_id', project.id)

      if (messagesError) throw messagesError

      const { error: areasError } = await supabase
        .from('requirement_areas')
        .update({
          is_covered: false,
          coverage_score: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', project.id)

      if (areasError) throw areasError

      const { error: projectError } = await supabase
        .from('projects')
        .update({
          requirement_score: 0,
          status: 'gathering',
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (projectError) throw projectError

      router.push(`/projects/${project.id}/gather`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      alert(`Failed to restart gathering: ${message}`)
      setRestarting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading">{project.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {project.client_name && (
            <p className="text-text-secondary mt-1">{project.client_name}</p>
          )}
          {project.client_industry && (
            <Badge variant="outline" className="mt-2">{project.client_industry}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/gather`}>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Gather
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="gap-2"
            onClick={handleRestartGathering}
            disabled={restarting}
          >
            {restarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {restarting ? 'Restarting...' : 'Restart Gathering'}
          </Button>
          <Link href={`/projects/${project.id}/documents`}>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
