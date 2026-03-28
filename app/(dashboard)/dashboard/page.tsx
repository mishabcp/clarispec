import { createClient } from '@/lib/supabase/server'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import type {
  DashboardChartMonthlyItem,
  DashboardChartScoreBucket,
  DashboardChartStatusItem,
} from '@/components/dashboard/DashboardCharts'
import { DashboardPageWrapper } from '@/components/dashboard/DashboardPageWrapper'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

function buildStatusChartData(
  projects: Pick<ProjectWithDocs, 'status'>[]
): DashboardChartStatusItem[] {
  return [
    { name: 'Gathering', value: projects.filter((p) => p.status === 'gathering').length },
    { name: 'Completed', value: projects.filter((p) => p.status === 'completed').length },
    { name: 'Archived', value: projects.filter((p) => p.status === 'archived').length },
  ]
}

function buildMonthlyProjectSeries(
  projects: Pick<ProjectWithDocs, 'created_at'>[]
): DashboardChartMonthlyItem[] {
  const now = new Date()
  const buckets: { key: string; label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    buckets.push({ key, label, count: 0 })
  }
  for (const p of projects) {
    const key = p.created_at.slice(0, 7)
    const b = buckets.find((x) => x.key === key)
    if (b) b.count++
  }
  return buckets.map(({ label, count }) => ({ label, count }))
}

function buildScoreBuckets(
  projects: Pick<ProjectWithDocs, 'requirement_score'>[]
): DashboardChartScoreBucket[] {
  const out: DashboardChartScoreBucket[] = [
    { range: '0–25', count: 0 },
    { range: '26–50', count: 0 },
    { range: '51–75', count: 0 },
    { range: '76–100', count: 0 },
  ]
  for (const p of projects) {
    const s = p.requirement_score
    if (s <= 25) out[0].count++
    else if (s <= 50) out[1].count++
    else if (s <= 75) out[2].count++
    else out[3].count++
  }
  return out
}

// Define types for server-side
interface ProjectWithDocs {
  id: string
  name: string
  client_name: string | null
  client_industry: string | null
  status: 'gathering' | 'completed' | 'archived'
  requirement_score: number
  created_at: string
  documents: { count: number }[]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all dashboard data in parallel for maximum speed
  const [profileRes, projectsRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('projects')
      // Supabase's documents(count) is very efficient for fetching document counts in one go
      .select('*, documents(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  ])

  const userName = profileRes.data?.full_name || ''
  const projectsData = projectsRes.data as any[] || []
  
  // Transform data for the UI
  const projects = projectsData.map(p => ({
    ...p,
    _documentCount: p.documents?.[0]?.count || 0
  }))

  const projectIds = projects.map(p => p.id)
  
  // Fetch widgets data if projects exist
  let documents: any[] = []
  let areas: any[] = []
  
  if (projectIds.length > 0) {
    const [docsRes, areasRes] = await Promise.all([
      supabase
        .from('documents')
        .select('*, projects(name)')
        .in('project_id', projectIds)
        .order('generated_at', { ascending: false })
        .limit(10),
      supabase
        .from('requirement_areas')
        .select('*')
        .in('project_id', projectIds)
    ])

    documents = (docsRes.data || []).map(d => ({
       ...d,
       projectName: (d as any).projects?.name || 'Unknown'
    }))
    areas = areasRes.data || []
  }

  const totalProjects = projects.length
  const completed = projects.filter(p => p.status === 'completed').length
  const documentsGenerated = projects.reduce((acc, p) => acc + (p as any)._documentCount, 0)
  const completionRate = totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0
  const avgScore = totalProjects > 0 ? Math.round(projects.reduce((acc, p) => acc + p.requirement_score, 0) / totalProjects) : 0

  const statusChartData = buildStatusChartData(projects)
  const monthlyChartData = buildMonthlyProjectSeries(projects)
  const scoreBucketData = buildScoreBuckets(projects)

  return (
    <DashboardPageWrapper>
      <DashboardHeader userName={userName} />

      <StatsBar
        totalProjects={totalProjects}
        avgScore={avgScore}
        completionRate={completionRate}
        documentsGenerated={documentsGenerated}
      />

      <DashboardCharts
        statusData={statusChartData}
        monthlyData={monthlyChartData}
        scoreBuckets={scoreBucketData}
        hasProjects={totalProjects > 0}
      />

      {projects.length > 0 && (
        <DashboardWidgets projects={projects} documents={documents} areas={areas} />
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-[#0a0a0b]/60 backdrop-blur-[64px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-24 rounded-[1px]">
          <p className="text-white/40 mb-6 font-light tracking-wide text-sm">No projects yet. Create your first one to get started.</p>
          <Link href="/projects/new" className="group relative h-11 bg-white text-black hover:bg-white/90 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-8 flex items-center justify-center">
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 border-b border-white/[0.08] pb-4">
            Your Projects
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                documentCount={(project as any)._documentCount}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </DashboardPageWrapper>
  )
}
