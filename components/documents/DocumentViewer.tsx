'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ExportMenu } from './ExportMenu'
import { AIEditBar } from './AIEditBar'
import { InlineDiff } from './InlineDiff'
import type { Document } from '@/types'
import { Pencil, Save, X, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DocumentViewerProps {
  document: Document
  onUpdate?: (updatedDoc: Document) => void
}

export function DocumentViewer({ document, onUpdate }: DocumentViewerProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(document.content)
  const [saving, setSaving] = useState(false)

  const [aiEditing, setAiEditing] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState('')

  const articleRef = useRef<HTMLElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const saveContent = useCallback(async (newContent: string) => {
    setSaving(true)
    const { data, error } = await supabase
      .from('documents')
      .update({
        content: newContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document.id)
      .select()
      .single()

    if (!error && data) {
      setContent(newContent)
      onUpdate?.(data as Document)
    }

    setSaving(false)
    return !error
  }, [document.id, onUpdate, supabase])

  async function handleManualSave() {
    const ok = await saveContent(content)
    if (ok) setEditing(false)
  }

  function handleManualCancel() {
    setContent(document.content)
    setEditing(false)
  }

  function handleTextSelection() {
    if (!aiEditing || aiResult) return
    const sel = window.getSelection()?.toString().trim()
    if (sel && sel.length > 3) {
      setSelectedText(sel)
    }
  }

  async function handleAiApply(instruction: string) {
    setAiProcessing(true)
    setAiError(null)

    try {
      const res = await fetch('/api/ai/edit-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: content,
          instruction,
          selectedText: selectedText || undefined,
          documentType: document.doc_type,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(body.error || `API error ${res.status}`)
      }

      const data = await res.json()
      setAiResult(data.content)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAiProcessing(false)
    }
  }

  const handleDiffResolve = useCallback(async (finalContent: string) => {
    await saveContent(finalContent)
    setAiResult(null)
    setAiEditing(false)
    setSelectedText('')
  }, [saveContent])

  const handleDiffAcceptAll = useCallback(async (newContent: string) => {
    await saveContent(newContent)
    setAiResult(null)
    setAiEditing(false)
    setSelectedText('')
  }, [saveContent])

  const handleDiffRejectAll = useCallback(() => {
    setAiResult(null)
    setSelectedText('')
  }, [])

  function handleAiClose() {
    setAiEditing(false)
    setAiResult(null)
    setSelectedText('')
    setAiError(null)
  }

  const showViewMode = !editing && !aiResult
  const showManualEdit = editing && !aiResult
  const showDiffMode = !!aiResult

  const aiBarVisible = aiEditing && !aiResult

  return (
    <div className="flex flex-col">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-8">
        <div className="flex items-center gap-3">
          {!editing && !aiResult && (
            <>
              <Button 
                variant="outline" 
                className="h-10 rounded-none border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6" 
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3 mr-2" />
                Edit Manually
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-none border-white/[0.15] bg-white text-black hover:bg-white/90 transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                onClick={() => setAiEditing(true)}
                disabled={aiEditing}
              >
                <Sparkles className="h-3 w-3 mr-2" />
                AI Reformulate
              </Button>
            </>
          )}
          {showManualEdit && (
            <>
              <Button 
                className="h-10 rounded-none bg-white text-black hover:bg-white/90 transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6" 
                onClick={handleManualSave} 
                disabled={saving}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                {saving ? 'Saving' : 'Commit Changes'}
              </Button>
              <Button 
                variant="ghost" 
                className="h-10 rounded-none text-white/40 hover:text-white hover:bg-white/[0.05] transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6" 
                onClick={handleManualCancel}
              >
                <X className="h-3 w-3 mr-2" />
                Abort
              </Button>
            </>
          )}
        </div>
        {!showDiffMode && (
          <div className="flex items-center gap-4">
            <ExportMenu title={document.title} content={content} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {aiError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 rounded-none border border-red-500/20 bg-red-500/[0.05] p-4 text-xs font-light text-red-200 uppercase tracking-widest flex items-center justify-between"
          >
            <span>Error: {aiError}</span>
            <button onClick={() => setAiError(null)} className="text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showDiffMode && (
        <div className="mb-12">
          <InlineDiff
            oldContent={content}
            newContent={aiResult!}
            onResolve={handleDiffResolve}
            onAcceptAll={handleDiffAcceptAll}
            onRejectAll={handleDiffRejectAll}
          />
        </div>
      )}

      {showManualEdit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <div className="absolute top-4 right-4 text-[9px] uppercase tracking-widest font-black text-white/20 select-none">Manual Edit Mode</div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[70vh] w-full bg-white/[0.02] border-white/[0.08] rounded-none p-10 font-mono text-sm text-white/80 leading-relaxed focus:border-white/20 transition-colors resize-none"
          />
        </motion.div>
      )}

      {showViewMode && (
        <motion.article
          ref={articleRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onMouseUp={handleTextSelection}
          className={cn(
            "prose prose-invert max-w-none prose-headings:font-heading prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-light prose-headings:text-white/90 prose-p:text-white/60 prose-p:font-light prose-p:leading-relaxed prose-p:text-base prose-strong:text-white prose-strong:font-bold prose-li:text-white/60 prose-li:font-light prose-td:text-white/60 prose-th:text-white/90 prose-th:font-bold prose-th:uppercase prose-th:tracking-widest prose-th:text-[10px] prose-table:border-white/[0.08] prose-hr:border-white/[0.08]",
            "selection:bg-white selection:text-black"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </motion.article>
      )}

      {/* Fixed UI components */}
      <AnimatePresence>
        {aiBarVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-10 left-1/2 z-[100] w-full max-w-3xl px-8"
          >
            <AIEditBar
              selectedText={selectedText}
              processing={aiProcessing}
              onApply={handleAiApply}
              onClearSelection={() => setSelectedText('')}
              onClose={handleAiClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {aiBarVisible && <div className="h-48" />}
    </div>
  )
}
