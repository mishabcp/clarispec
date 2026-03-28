'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportToPDF } from '@/lib/documents/exportPDF'
import { exportToMarkdown } from '@/lib/documents/exportMarkdown'
import { Download, FileText, FileCode, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ExportMenuProps {
  title: string
  content: string
}

export function ExportMenu({ title, content }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)

  async function handlePDF() {
    setExporting(true)
    try {
      await exportToPDF(title, content)
    } catch {}
    setExporting(false)
    setOpen(false)
  }

  function handleMarkdown() {
    exportToMarkdown(title, content)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="h-10 rounded-none border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6 gap-3"
        onClick={() => setOpen(!open)}
      >
        <Download className="h-3 w-3" />
        Export
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", open && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 cursor-default" 
              onClick={() => setOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full z-50 mt-4 w-56 rounded-none border border-white/[0.08] bg-[#0a0a0b]/90 backdrop-blur-[32px] p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)]"
            >
              <button
                onClick={handlePDF}
                disabled={exporting}
                className="flex w-full items-center gap-3 rounded-none px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-white/40 hover:bg-white/[0.05] hover:text-white transition-all duration-300 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                Export as PDF
              </button>
              <button
                onClick={handleMarkdown}
                className="flex w-full items-center gap-3 rounded-none px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-white/40 hover:bg-white/[0.05] hover:text-white transition-all duration-300"
              >
                <FileCode className="h-3 w-3" />
                Export as Markdown
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
