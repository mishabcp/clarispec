'use client'

import { FolderOpen, Target, FileText, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatsBarProps {
  totalProjects: number
  avgScore: number
  completionRate: number
  documentsGenerated: number
}

export function StatsBar({ totalProjects, avgScore, completionRate, documentsGenerated }: StatsBarProps) {
  const stats = [
    { label: 'Total Projects', value: totalProjects, icon: FolderOpen, color: 'text-white' },
    { label: 'Avg Score', value: `${avgScore}%`, icon: Target, color: 'text-white/80' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle, color: 'text-white/60' },
    { label: 'Total Docs', value: documentsGenerated, icon: FileText, color: 'text-white/40' },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          variants={itemAnim}
          className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-6 overflow-hidden hover:border-white/[0.2] transition-colors duration-500"
        >
          {/* Subtle hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-none bg-white/[0.05] border border-white/[0.1]", stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-3xl font-extralight font-heading text-white">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 mt-1">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
