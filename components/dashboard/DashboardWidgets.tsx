'use client'

import { motion } from 'framer-motion'
import { FileText, Factory, Activity, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Project, Document, RequirementArea } from '@/types'
import Link from 'next/link'

interface DashboardWidgetsProps {
  projects: Project[]
  documents: (Document & { projectName: string })[]
  areas: RequirementArea[]
}

export function DashboardWidgets({ projects, documents, areas }: DashboardWidgetsProps) {
  // 1. Industry Distribution
  const industryCounts = projects.reduce((acc, p) => {
    const industry = p.client_industry || 'Unspecified'
    acc[industry] = (acc[industry] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // 2. Requirement Coverage (Top 4 most covered areas)
  const coverageStats = areas.reduce((acc, area) => {
    if (!acc[area.area_name]) {
      acc[area.area_name] = { total: 0, covered: 0 }
    }
    acc[area.area_name].total += 1
    if (area.is_covered) acc[area.area_name].covered += 1
    return acc
  }, {} as Record<string, { total: number; covered: number }>)

  const coverageList = Object.entries(coverageStats)
    .map(([name, stats]) => ({
      name,
      percentage: stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4)

  // 3. Activity Feed (Projects + Docs)
  const activities = [
    ...projects.map(p => ({
      id: p.id,
      type: 'project',
      title: `Project Created: ${p.name}`,
      date: new Date(p.created_at),
      href: `/projects/${p.id}`
    })),
    ...documents.map(d => ({
      id: d.id,
      type: 'document',
      title: `Document Generated: ${d.title}`,
      date: new Date(d.generated_at),
      href: `/projects/${d.project_id}/documents/${d.id}`
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      
      {/* Latest Documents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-6 overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-4 w-4 text-white/50" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Recent Documents</h3>
        </div>
        <div className="flex-1 space-y-4">
          {documents.length > 0 ? documents.slice(0, 3).map(doc => (
            <Link key={doc.id} href={`/projects/${doc.project_id}/documents/${doc.id}`} className="block group/item">
              <p className="font-light text-sm text-white/90 truncate group-hover/item:text-white transition-colors">{doc.title}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">{doc.projectName}</p>
            </Link>
          )) : (
            <p className="text-xs text-white/30 italic">No documents generated.</p>
          )}
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-6 overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-4 w-4 text-white/50" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Recent Activity</h3>
        </div>
        <div className="flex-1 space-y-4">
          {activities.length > 0 ? activities.map(act => (
            <Link key={act.id + act.type} href={act.href} className="flex gap-3 group/item">
              <div className="mt-0.5 flex-shrink-0">
                <Clock className="h-3 w-3 text-white/30 group-hover/item:text-white/60 transition-colors" />
              </div>
              <div>
                <p className="font-light text-xs text-white/80 group-hover/item:text-white transition-colors line-clamp-2">{act.title}</p>
                <p className="text-[8px] text-white/30 uppercase tracking-widest mt-1">{formatDate(act.date.toISOString())}</p>
              </div>
            </Link>
          )) : (
            <p className="text-xs text-white/30 italic">No recent activity.</p>
          )}
        </div>
      </motion.div>

      {/* Industry Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-6 overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <Factory className="h-4 w-4 text-white/50" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Top Industries</h3>
        </div>
        <div className="flex-1 space-y-4">
          {sortedIndustries.length > 0 ? sortedIndustries.map(([ind, count]) => (
            <div key={ind} className="flex items-center justify-between">
              <span className="font-light text-xs text-white/80 uppercase tracking-wider truncate pr-2">{ind}</span>
              <span className="text-[10px] text-white/50 font-bold tracking-widest bg-white/[0.05] px-2 py-0.5 rounded-none border border-white/10">{count}</span>
            </div>
          )) : (
            <p className="text-xs text-white/30 italic">No industry data.</p>
          )}
        </div>
      </motion.div>

      {/* Coverage Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-6 overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="h-4 w-4 text-white/50" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Requirement Coverage</h3>
        </div>
        <div className="flex-1 space-y-4">
          {coverageList.length > 0 ? coverageList.map(item => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold">
                <span className="text-white/60 truncate">{item.name}</span>
                <span className="text-white/90">{item.percentage}%</span>
              </div>
              <div className="h-0.5 w-full bg-white/[0.05]">
                <div className="h-full bg-white/60" style={{ width: `${item.percentage}%` }} />
              </div>
            </div>
          )) : (
            <p className="text-xs text-white/30 italic">No coverage data.</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
