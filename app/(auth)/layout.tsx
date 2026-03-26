'use client'

import { motion } from 'framer-motion'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden selection:bg-white/5 font-sans">
      {/* Cinematic Material Grain Effect */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Layered Lighting - 'The Material Warmth' */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[900px] rounded-full bg-white/[0.015] blur-[160px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/[0.01] blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-amber-500/[0.01] blur-[120px] pointer-events-none -translate-x-1/4 translate-y-1/4" />
      
      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, letterSpacing: '0.1em', filter: 'blur(12px)' }}
            animate={{ opacity: 1, letterSpacing: '0.28em', filter: 'blur(0px)' }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.36, 1] }}
            className="text-[42px] font-extralight text-white uppercase font-heading leading-none"
          >
            Clarispec
          </motion.h1>
        </div>
        
        <div className="relative bg-[#0a0a0b]/90 border border-white/[0.08] shadow-[0_48px_100px_-32px_rgba(0,0,0,0.9)] backdrop-blur-[64px] rounded-[1px]">
          {/* Reactive Machined-Silver Hairline Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent shadow-[0_1px_4px_rgba(255,255,255,0.05)]" />
          
          <div className="p-10 sm:p-14">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

