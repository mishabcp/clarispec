'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types'
import { ArrowRight, FileText } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  documentCount: number
  index: number
}

const statusConfig = {
  gathering: { label: 'Gathering', variant: 'warning' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  archived: { label: 'Archived', variant: 'secondary' as const },
}

export function ProjectCard({ project, documentCount, index }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-6 transition-all duration-500 hover:border-white/[0.2] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-light text-xl text-white tracking-tight truncate">
              {project.name}
            </h3>
            {project.client_name && (
              <p className="text-sm font-light text-white/40 mt-1 tracking-wide">{project.client_name}</p>
            )}
          </div>
          <Badge variant={status.variant} className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 rounded-none tracking-widest uppercase text-[9px] font-bold">
            {status.label}
          </Badge>
        </div>

        {project.client_industry && (
          <Badge variant="outline" className="mt-4 border-white/10 text-white/50 bg-transparent rounded-none tracking-wider text-[10px] uppercase font-bold px-2 py-0.5">
            {project.client_industry}
          </Badge>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-white/40">
            <span>Requirements</span>
            <span>{project.requirement_score}%</span>
          </div>
          <Progress
            value={project.requirement_score}
            className="h-1 bg-white/[0.05]"
            indicatorClassName={
              project.requirement_score >= 70
                ? 'bg-white'
                : project.requirement_score >= 40
                ? 'bg-white/60'
                : 'bg-white/30'
            }
          />
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] font-mono text-white/40 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {documentCount} docs
            </span>
            <span>{formatDate(project.created_at)}</span>
          </div>
          <Link href={`/projects/${project.id}`} className="flex items-center justify-center h-8 px-3 gap-2 hover:bg-white/5 hover:text-white text-white/60 rounded-none transition-colors duration-300 font-bold uppercase tracking-widest text-[9px]">
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
