'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatInterface } from '@/components/gather/ChatInterface'
import { RequirementProgress } from '@/components/gather/RequirementProgress'
import { getDefaultRequirementAreas } from '@/lib/ai/conversation'
import { clientError, clientLog, clientWarn } from '@/lib/client-log'
import { useToast } from '@/components/ui/toast'
import type { Project, RequirementAreas, DepthLevel } from '@/types'
import { DEPTH_THRESHOLDS } from '@/types'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GatherPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [areas, setAreas] = useState<RequirementAreas>(getDefaultRequirementAreas())
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const { addToast } = useToast()

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' })
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        if (!res.ok) {
          router.replace('/dashboard')
          return
        }
        const projectData = (await res.json()) as Project
        setProject(projectData)
        setScore(projectData.requirement_score || 0)
      } catch (e) {
        clientError('[Gather] Failed to load project via API:', e)
        router.replace('/dashboard')
        return
      }

      const { data: areasData } = await supabase
        .from('requirement_areas')
        .select('*')
        .eq('project_id', projectId)

      if (areasData) {
        const areasObj = getDefaultRequirementAreas()
        areasData.forEach((area) => {
          const key = area.area_name as keyof RequirementAreas
          if (key in areasObj) {
            areasObj[key] = area.is_covered
          }
        })
        setAreas(areasObj)
      }

      setLoading(false)
    }

    loadProject()
  }, [projectId, router, supabase])

  function handleScoreUpdate(newScore: number, newAreas: RequirementAreas) {
    setScore(newScore)
    setAreas(newAreas)
  }

  async function handleGenerate() {
    if (!project) return

    setGenerating(true)

    try {
      const { data: selections, error: selError } = await supabase
        .from('document_selections')
        .select('doc_type')
        .eq('project_id', projectId)
        .eq('is_selected', true)

      if (selError) {
        clientError('[Generate] Failed to fetch document selections:', selError.message)
      }

      let selectedDocs = selections?.map((s) => s.doc_type) || []

      // If no selections found (e.g. RLS issue or missing rows), default to all doc types
      if (selectedDocs.length === 0) {
        clientWarn('[Generate] No document selections found — using all document types as default')
        const { DOCUMENT_TYPES } = await import('@/types')
        selectedDocs = DOCUMENT_TYPES.map((d) => d.type)
      }

      clientLog('[Generate] Generating docs:', selectedDocs)

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          selectedDocs,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        clientError('[Generate] API error:', res.status, errBody)
        const isRateLimit = res.status === 429
        addToast({
          title: 'Generation Failed',
          description: isRateLimit
            ? 'AI is at capacity. Please try again in a minute.'
            : 'Failed to generate documents. Please try again.',
          variant: 'danger'
        })
        setGenerating(false)
        return
      }

      await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId)

      addToast({ title: 'Documents Generated', description: 'All documents have been created successfully.', variant: 'success' })
      router.push(`/projects/${projectId}/documents`)
    } catch (err) {
      clientError('[Generate] Error:', err)
      addToast({ title: 'Generation Failed', description: 'Failed to generate documents due to a server error.', variant: 'danger' })
    }

    setGenerating(false)
  }

  const [showProgressMobile, setShowProgressMobile] = useState(false)

  if (loading || !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] bg-[#0a0a0b]/40 backdrop-blur-[64px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[1px] overflow-hidden relative">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-white/[0.08] bg-black/40 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Project Progress</span>
          <span className="text-[11px] font-bold text-white tracking-widest uppercase">{score}% COMPLETE</span>
        </div>
        <button 
          onClick={() => setShowProgressMobile(!showProgressMobile)}
          className="h-10 px-3 border border-white/[0.08] bg-white/[0.03] text-[10px] uppercase font-bold tracking-widest text-white hover:bg-white/[0.08] transition-all"
        >
          {showProgressMobile ? 'Close Progress' : 'View Progress'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel (Desktop) */}
        <div className="w-72 border-r border-white/[0.08] shrink-0 overflow-y-auto hidden lg:block bg-gradient-to-b from-white/[0.02] to-transparent">
          <RequirementProgress
            projectName={project.name}
            clientName={project.client_name}
            score={score}
            areas={areas}
            depthLevel={project.depth_level as DepthLevel}
            onGenerate={handleGenerate}
            generating={generating}
          />
        </div>

        {/* Mobile Progress Overlay */}
        <AnimatePresence>
          {showProgressMobile && (
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 lg:hidden bg-[#0a0a0b] overflow-y-auto"
            >
              <div className="p-3 border-b border-white/[0.08] flex justify-between items-center bg-black/40">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">Coverage Overview</span>
                <button onClick={() => setShowProgressMobile(false)} className="text-white/40 hover:text-white">
                  <Loader2 className="h-5 w-5 rotate-45" /> {/* Generic X icon replacement or use X */}
                </button>
              </div>
              <RequirementProgress
                projectName={project.name}
                clientName={project.client_name}
                score={score}
                areas={areas}
                depthLevel={project.depth_level as DepthLevel}
                onGenerate={handleGenerate}
                generating={generating}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right panel - Chat */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-black/20">
          <ChatInterface
            project={project}
            onScoreUpdate={handleScoreUpdate}
          />
        </div>
      </div>
    </div>
  )
}
