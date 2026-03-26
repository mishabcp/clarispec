'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { Button } from '@/components/ui/button'
import type { Project } from '@/types'
import { Plus, Loader2 } from 'lucide-react'

interface ProjectWithDocs extends Project {
  _documentCount: number
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithDocs[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) {
        setUserName(profile.full_name)
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectsData) {
        const projectsWithDocs = await Promise.all(
          projectsData.map(async (project) => {
            const { count } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
            return { ...project, _documentCount: count || 0 }
          })
        )
        setProjects(projectsWithDocs as ProjectWithDocs[])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const totalProjects = projects.length
  const inProgress = projects.filter(p => p.status === 'gathering').length
  const completed = projects.filter(p => p.status === 'completed').length
  const documentsGenerated = projects.reduce((acc, p) => acc + p._documentCount, 0)

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">
            {userName ? `Welcome back, ${userName}` : 'Dashboard'}
          </h1>
          <p className="text-text-secondary mt-1">Manage your projects and requirements</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <StatsBar
        totalProjects={totalProjects}
        inProgress={inProgress}
        completed={completed}
        documentsGenerated={documentsGenerated}
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-text-muted mb-4">No projects yet. Create your first one!</p>
          <Link href="/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              documentCount={project._documentCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
