'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatInterface } from '@/components/gather/ChatInterface'
import { RequirementProgress } from '@/components/gather/RequirementProgress'
import { getDefaultRequirementAreas } from '@/lib/ai/conversation'
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
  const supabase = createClient()

  useEffect(() => {
    async function loadProject() {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectData) {
        setProject(projectData as Project)
        setScore(projectData.requirement_score || 0)
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
  }, [projectId])

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
        console.error('[Generate] Failed to fetch document selections:', selError.message)
      }

      let selectedDocs = selections?.map((s) => s.doc_type) || []

      // If no selections found (e.g. RLS issue or missing rows), default to all doc types
      if (selectedDocs.length === 0) {
        console.warn('[Generate] No document selections found — using all document types as default')
        const { DOCUMENT_TYPES } = await import('@/types')
        selectedDocs = DOCUMENT_TYPES.map((d) => d.type)
      }

      console.log('[Generate] Generating docs:', selectedDocs)

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
        console.error('[Generate] API error:', res.status, errBody)
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
      console.error('[Generate] Error:', err)
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
