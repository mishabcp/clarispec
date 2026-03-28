'use client'

import { motion } from 'framer-motion'
import { BookOpen, Brain, FileText, Lock } from 'lucide-react'

export default function GuidePage() {
  const steps = [
    {
      icon: BookOpen,
      title: 'Create a Project',
      description: 'Start a new project by defining the high-level brief. Our system immediately categorizes your objective, sets a baseline requirement score, and prepares logical investigation paths.'
    },
    {
      icon: Brain,
      title: 'AI Consultation',
      description: 'Chat with the AI assistant. It will ask smart follow-up questions to uncover missing details, edge cases, and requirements you may not have considered.'
    },
    {
      icon: FileText,
      title: 'Generate Documents',
      description: 'Once the Requirement Score crosses 85%, the system can auto-compile your isolated chats into formal PRDs, standard SRS documents, and detailed user flow architectures.'
    },
    {
      icon: Lock,
      title: 'Security & Access',
      description: 'All projects remain private to your workspace. Administrators maintain full oversight through the main dashboard.'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl space-y-12"
    >
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-[32px] font-extralight font-heading tracking-tight text-white/90 uppercase"
        >
          User Guide
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-white/40 mt-2 text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          How the platform works
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="grid gap-6"
      >
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + (0.1 * i), ease: [0.16, 1, 0.3, 1] }}
            className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-8 transition-all duration-500 hover:border-white/[0.2] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10 flex gap-6">
              <div className="flex-shrink-0 mt-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-white/[0.03] border border-white/[0.1]">
                  <step.icon className="h-5 w-5 text-white/80" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-light text-white tracking-tight">{step.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed font-light text-white/50 tracking-wide max-w-2xl">
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="pt-8 border-t border-white/[0.08]"
      >
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 text-center">
          For technical support, contact the system administrator.
        </p>
      </motion.div>
    </motion.div>
  )
}
