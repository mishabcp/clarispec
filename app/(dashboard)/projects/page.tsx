'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import type { Project } from '@/types'
import { Plus, Loader2, FolderOpen } from 'lucide-react'

interface ProjectWithDocs extends Project {
  _documentCount: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithDocs[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
  }, [supabase])

  if (loading) {
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
      className="space-y-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-[32px] font-extralight font-heading tracking-tight text-white/90 uppercase"
          >
            All Projects
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-white/40 mt-2 text-[10px] uppercase tracking-[0.2em] font-bold"
          >
            Browse & manage all your projects
          </motion.p>
        </div>
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3, duration: 0.8 }}
        >
          <Link href="/projects/new" className="group relative flex items-center justify-center h-11 bg-white text-black hover:bg-white/90 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-8">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </span>
          </Link>
        </motion.div>
      </div>

      {projects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center justify-center bg-[#0a0a0b]/60 backdrop-blur-[64px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-24 rounded-[1px]"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
            <FolderOpen className="h-5 w-5 text-white/40" />
          </div>
          <p className="text-white/40 mb-6 font-light tracking-wide text-sm">No projects yet. Create your first one to get started.</p>
          <Link href="/projects/new" className="group relative h-11 bg-white text-black hover:bg-white/90 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-8 flex items-center justify-center">
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Create Project
            </span>
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              documentCount={project._documentCount}
              index={i}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
