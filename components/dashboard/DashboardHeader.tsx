'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface DashboardHeaderProps {
  userName?: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-[32px] font-extralight font-heading tracking-tight text-white/90 uppercase"
        >
          {userName ? `Welcome, ${userName}` : 'Dashboard'}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-white/40 mt-2 text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          Your Overview
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
  )
}
