'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DocumentViewer } from '@/components/documents/DocumentViewer'
import { clientError } from '@/lib/client-log'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Document } from '@/types'
import { ArrowLeft, RotateCcw, Loader2, FileText, Calendar, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/utils'

export default function DocumentViewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const docId = params.docId as string
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadDocument() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single()

      if (data) setDocument(data as Document)
      setLoading(false)
    }

    loadDocument()
  }, [docId, supabase])

  async function handleRegenerate() {
    if (!document) return
    setRegenerating(true)

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          selectedDocs: [document.doc_type],
        }),
      })

      if (res.ok) {
        // Delete old version and reload
        await supabase.from('documents').delete().eq('id', docId)
        router.push(`/projects/${projectId}/documents`)
      }
    } catch (err) {
      clientError('Regenerate error:', err)
    }

    setRegenerating(false)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-white/40">Document not found.</p>
        <Link href={`/projects/${projectId}/documents`} className="text-white underline">Back to documents</Link>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Header / Breadcrumbs */}
      <div className="space-y-6">
        <Link
          href={`/projects/${projectId}/documents`}
          className="group inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> 
          Back to Documents
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.03]">
                <FileText className="h-5 w-5 text-white/60" />
              </div>
              <h1 className="text-3xl font-extralight font-heading tracking-tight text-white/90 uppercase">{document.title}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
                <Hash className="h-3 w-3" />
                <span>Type: <span className="text-white/60">{document.doc_type.replace(/_/g, ' ')}</span></span>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
                <RotateCcw className="h-3 w-3" />
                <span>Version: <span className="text-white/60">{document.version}</span></span>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
                <Calendar className="h-3 w-3" />
                <span>Generated: <span className="text-white/60">{formatDate(document.generated_at)}</span></span>
              </div>
              {document.is_edited && (
                <Badge variant="secondary" className="bg-white/5 text-white/40 border-white/10 text-[9px] uppercase tracking-widest rounded-none py-0 px-2 h-5">Edited</Badge>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="h-11 rounded-none border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em]"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Regenerate Document
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-[70vh] rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
        
        <div className="relative p-8 lg:p-16">
          <DocumentViewer
            document={document}
            onUpdate={(updated) => setDocument(updated)}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
