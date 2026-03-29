'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface DashboardPageWrapperProps {
  children: ReactNode
  userName?: string
}

export function DashboardPageWrapper({ children, userName }: DashboardPageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-12"
    >
      {children}
    </motion.div>
  )
}
