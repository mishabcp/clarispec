'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ProjectProgress } from '@/components/project/ProjectProgress'
import type { Project, RequirementArea } from '@/types'
import { Loader2, Zap, Settings, Command } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [areas, setAreas] = useState<RequirementArea[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

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
  }, [projectId, supabase])

  if (loading || !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto space-y-12"
    >
      <ProjectHeader project={project} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-8 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="flex items-center justify-center w-8 h-8 rounded-none bg-white/[0.05] border border-white/[0.1] shadow-inner">
                <Command className="h-4 w-4 text-white/80" />
              </div>
              <h2 className="text-[12px] uppercase tracking-[0.2em] font-bold text-white/70">Initial Brief</h2>
            </div>
            
            <div className="relative z-10">
              <p className="text-[14px] leading-relaxed font-light text-white/70 whitespace-pre-wrap tracking-wide">
                {project.initial_brief}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-8 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-white/[0.08] pb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-none bg-white/[0.05] border border-white/[0.1] shadow-inner">
                <Settings className="h-4 w-4 text-white/80" />
              </div>
              <h2 className="text-[12px] uppercase tracking-[0.2em] font-bold text-white/70">Project Parameters</h2>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 relative z-10 pt-2">
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Analysis Depth</p>
                <div className="flex items-center gap-2 text-white font-light text-sm tracking-wide capitalize">
                  <Zap className="h-3.5 w-3.5 text-white/60" /> {project.depth_level}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Status</p>
                <p className="text-white font-light text-sm tracking-wide capitalize">{project.status}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Created On</p>
                <p className="text-white font-light text-sm tracking-wide">{formatDate(project.created_at)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Last Updated</p>
                <p className="text-white font-light text-sm tracking-wide">{formatDate(project.updated_at)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24">
            <div className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/60 backdrop-blur-[64px] p-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
              <ProjectProgress score={project.requirement_score} areas={areas} />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
