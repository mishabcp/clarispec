'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DocumentViewer } from '@/components/documents/DocumentViewer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Document } from '@/types'
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'

export default function DocumentViewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const docId = params.docId as string
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const supabase = createClient()

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
  }, [docId])

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
      console.error('Regenerate error:', err)
    }

    setRegenerating(false)
  }

  if (loading || !document) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}/documents`}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Documents
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">{document.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="outline">{document.doc_type.replace(/_/g, ' ')}</Badge>
            <span className="text-xs text-text-muted">Version {document.version}</span>
            {document.is_edited && <Badge variant="secondary">Edited</Badge>}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Regenerate
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 lg:p-8">
        <DocumentViewer
          document={document}
          onUpdate={(updated) => setDocument(updated)}
        />
      </div>
    </div>
  )
}
