'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatInterface } from '@/components/gather/ChatInterface'
import { RequirementProgress } from '@/components/gather/RequirementProgress'
import { getDefaultRequirementAreas } from '@/lib/ai/conversation'
import { clientError, clientLog, clientWarn } from '@/lib/client-log'
import type { Project, RequirementAreas, DepthLevel } from '@/types'
import { DEPTH_THRESHOLDS } from '@/types'
import { Loader2 } from 'lucide-react'

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
        alert(
          isRateLimit
            ? 'AI is at capacity. Please try again in a minute.'
            : 'Failed to generate documents. Please try again.'
        )
        setGenerating(false)
        return
      }

      await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId)

      router.push(`/projects/${projectId}/documents`)
    } catch (err) {
      clientError('[Generate] Error:', err)
      alert('Failed to generate documents. Please try again.')
    }

    setGenerating(false)
  }

  if (loading || !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 lg:-m-8">
      {/* Left panel */}
      <div className="w-72 border-r border-border bg-surface shrink-0">
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

      {/* Right panel - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          project={project}
          onScoreUpdate={handleScoreUpdate}
        />
      </div>
    </div>
  )
}
