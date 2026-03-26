'use client'

import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ExportMenu } from './ExportMenu'
import { AIEditBar } from './AIEditBar'
import { InlineDiff } from './InlineDiff'
import type { Document } from '@/types'
import { Pencil, Save, X, Sparkles } from 'lucide-react'

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
  const supabase = createClient()

  async function saveContent(newContent: string) {
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
  }

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
  }, [])

  const handleDiffAcceptAll = useCallback(async (newContent: string) => {
    await saveContent(newContent)
    setAiResult(null)
    setAiEditing(false)
    setSelectedText('')
  }, [])

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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!editing && !aiResult && (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => setAiEditing(true)}
                disabled={aiEditing}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Edit with AI
              </Button>
            </>
          )}
          {showManualEdit && (
            <>
              <Button size="sm" className="gap-2" onClick={handleManualSave} disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleManualCancel}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
        {!showDiffMode && (
          <ExportMenu title={document.title} content={content} />
        )}
      </div>

      {aiError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {aiError}
          <button onClick={() => setAiError(null)} className="ml-2 underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {showDiffMode && (
        <InlineDiff
          oldContent={content}
          newContent={aiResult!}
          onResolve={handleDiffResolve}
          onAcceptAll={handleDiffAcceptAll}
          onRejectAll={handleDiffRejectAll}
        />
      )}

      {showManualEdit && (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[60vh] font-mono text-sm"
        />
      )}

      {showViewMode && (
        <article
          ref={articleRef}
          onMouseUp={handleTextSelection}
          className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-li:text-text-secondary prose-td:text-text-secondary prose-th:text-text-primary prose-th:font-semibold prose-table:border-border prose-hr:border-border"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      )}

      {/* Spacer so content isn't hidden behind the fixed AI bar */}
      {aiBarVisible && <div className="h-36" />}

      {aiBarVisible && (
        <AIEditBar
          selectedText={selectedText}
          processing={aiProcessing}
          onApply={handleAiApply}
          onClearSelection={() => setSelectedText('')}
          onClose={handleAiClose}
        />
      )}
    </div>
  )
}
