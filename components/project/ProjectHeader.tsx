'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import type { Project } from '@/types'
import { MessageSquare, FileText, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'

const statusConfig = {
  gathering: { label: 'Gathering Phase', variant: 'warning' as const },
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
  const { addToast } = useToast()

  async function handleRestartGathering() {
    const confirmed = window.confirm(
      'Are you sure you want to restart? This will permanently erase the current conversation and all generated documents for this project.'
    )
    if (!confirmed) return

    setRestarting(true)
    try {
      const { error: documentsError } = await supabase.from('documents').delete().eq('project_id', project.id)
      if (documentsError) throw documentsError

      const { error: selectionsError } = await supabase.from('document_selections').delete().eq('project_id', project.id)
      if (selectionsError) throw selectionsError

      const { error: messagesError } = await supabase.from('messages').delete().eq('project_id', project.id)
      if (messagesError) throw messagesError

      const { error: areasError } = await supabase.from('requirement_areas').update({
        is_covered: false,
        coverage_score: 0,
        updated_at: new Date().toISOString(),
      }).eq('project_id', project.id)
      if (areasError) throw areasError

      const { error: projectError } = await supabase.from('projects').update({
        requirement_score: 0,
        status: 'gathering',
        updated_at: new Date().toISOString(),
      }).eq('id', project.id)
      if (projectError) throw projectError

      addToast({ title: 'Project Restarted', description: 'Ready to start gathering requirements again.', variant: 'success' })
      router.push(`/projects/${project.id}/gather`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown fatal error'
      addToast({ title: 'Restart Failed', description: message, variant: 'danger' })
      setRestarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white transition-colors duration-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Projects
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-light font-heading text-white tracking-tight uppercase truncate max-w-2xl">{project.name}</h1>
            <Badge variant="outline" className="border-white/20 text-white/70 bg-transparent rounded-none tracking-widest uppercase text-[9px] font-bold px-3 py-1">
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/50">
            {project.client_name && <span>{project.client_name}</span>}
            {project.client_name && project.client_industry && <span>•</span>}
            {project.client_industry && <span>{project.client_industry}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/projects/${project.id}/gather`}>
            <button className="group relative flex items-center justify-center gap-2 h-10 bg-white text-black hover:bg-white/90 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] px-6">
              <MessageSquare className="h-3.5 w-3.5" />
              Start Gathering
            </button>
          </Link>
          <Link href={`/projects/${project.id}/documents`}>
            <button className="flex items-center justify-center gap-2 h-10 border border-white/[0.15] bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/[0.3] text-white transition-all duration-300 font-bold text-[10px] uppercase tracking-widest rounded-none px-6">
              <FileText className="h-3.5 w-3.5" />
              View Documents
            </button>
          </Link>
          <button
            onClick={handleRestartGathering}
            disabled={restarting}
            className="flex items-center justify-center gap-2 h-10 text-white/30 hover:text-red-400/90 transition-all duration-300 font-bold text-[10px] uppercase tracking-widest rounded-none px-4 disabled:opacity-50"
          >
            {restarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {restarting ? 'Restarting...' : 'Restart'}
          </button>
        </div>
      </div>
    </div>
  )
}
