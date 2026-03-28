'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, ArrowRight, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DOCUMENT_TYPES, type Document, type Project } from '@/types'

interface DocumentWithProject extends Document {
  projectName?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadDocuments() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Get user's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)

      if (!projectsData || projectsData.length === 0) {
        setLoading(false)
        return
      }

      const projectMap = new Map(projectsData.map(p => [p.id, p.name]))
      const projectIds = projectsData.map(p => p.id)

      // 2. Get documents for those projects
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .in('project_id', projectIds)
        .order('generated_at', { ascending: false })

      if (docsData) {
        const enrichedDocs = docsData.map(doc => ({
          ...doc,
          projectName: projectMap.get(doc.project_id) || 'Unknown Project'
        }))
        setDocuments(enrichedDocs as DocumentWithProject[])
      }

      setLoading(false)
    }

    loadDocuments()
  }, [supabase])

  const getDocTypeLabel = (type: string) => {
    const found = DOCUMENT_TYPES.find(d => d.type === type)
    return found ? found.title : type.replace('_', ' ').toUpperCase()
  }

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
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-[32px] font-extralight font-heading tracking-tight text-white/90 uppercase"
        >
          Recent Documents
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-white/40 mt-2 text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          All generated documents across projects
        </motion.p>
      </div>

      {documents.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center justify-center bg-[#0a0a0b]/60 backdrop-blur-[64px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-24 rounded-[1px]"
        >
          <p className="text-white/40 mb-6 font-light tracking-wide text-sm">No documents generated yet.</p>
          <Link href="/dashboard" className="group relative h-11 bg-white text-black hover:bg-white/90 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden px-8 flex items-center justify-center">
            <span className="relative z-10 flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5" />
              Return to Dashboard
            </span>
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid gap-4"
        >
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex items-center justify-between rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-5 transition-all duration-500 hover:border-white/[0.2] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-white/[0.05] border border-white/[0.1]">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-light text-lg text-white tracking-tight">{doc.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] uppercase tracking-widest font-bold text-white/40">
                    <span className="text-white/70">{doc.projectName}</span>
                    <span>•</span>
                    <span>{getDocTypeLabel(doc.doc_type)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 relative z-10">
                <div className="hidden sm:flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-white/30">
                  <Clock className="h-3 w-3" />
                  {formatDate(doc.generated_at)}
                </div>
                <Link href={`/projects/${doc.project_id}/documents/${doc.id}`} className="flex items-center justify-center h-8 px-3 gap-2 hover:bg-white/5 hover:text-white text-white/60 rounded-none transition-colors duration-300 font-bold uppercase tracking-widest text-[9px]">
                  View Output <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
