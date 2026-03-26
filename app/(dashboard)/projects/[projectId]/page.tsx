'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ProjectProgress } from '@/components/project/ProjectProgress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Project, RequirementArea } from '@/types'
import { Loader2 } from 'lucide-react'

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [areas, setAreas] = useState<RequirementArea[]>([])
  const [loading, setLoading] = useState(true)
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
      }

      const { data: areasData } = await supabase
        .from('requirement_areas')
        .select('*')
        .eq('project_id', projectId)

      if (areasData) {
        setAreas(areasData as RequirementArea[])
      }

      setLoading(false)
    }

    loadProject()
  }, [projectId])

  if (loading || !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ProjectHeader project={project} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Initial Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary whitespace-pre-wrap">{project.initial_brief}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Depth Level</p>
                  <p className="mt-1 text-sm font-medium capitalize">{project.depth_level}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
                  <p className="mt-1 text-sm font-medium capitalize">{project.status}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Industry</p>
                  <p className="mt-1 text-sm font-medium">{project.client_industry || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Client</p>
                  <p className="mt-1 text-sm font-medium">{project.client_name || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectProgress score={project.requirement_score} areas={areas} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
