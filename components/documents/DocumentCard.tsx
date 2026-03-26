'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Document } from '@/types'
import { FileText, Eye, RotateCcw, Loader2 } from 'lucide-react'

interface DocumentCardProps {
  document: Document
  projectId: string
  onRegenerate?: (docType: string) => void
}

const docTypeLabels: Record<string, string> = {
  brd: 'BRD',
  srs: 'SRS',
  user_stories: 'User Stories',
  architecture_overview: 'Architecture',
  workflow: 'Workflow',
  mvp_scope: 'MVP Scope',
  feature_list: 'Feature List',
  timeline: 'Timeline',
}

export function DocumentCard({ document, projectId, onRegenerate }: DocumentCardProps) {
  const wordCount = document.content.split(/\s+/).length
  const [navigating, setNavigating] = useState(false)
  const router = useRouter()

  function handleView() {
    setNavigating(true)
    router.push(`/projects/${projectId}/documents/${document.id}`)
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold font-heading text-sm">{document.title}</h3>
            <Badge variant="outline" className="mt-1 text-[10px]">
              {docTypeLabels[document.doc_type] || document.doc_type}
            </Badge>
          </div>
        </div>
        {document.is_edited && (
          <Badge variant="secondary" className="text-[10px]">Edited</Badge>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
        <span>{wordCount.toLocaleString()} words</span>
        <span>v{document.version}</span>
        <span>{formatDate(document.generated_at)}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 flex-1"
          onClick={handleView}
          disabled={navigating}
        >
          {navigating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {navigating ? 'Opening...' : 'View'}
        </Button>
        {onRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRegenerate(document.doc_type)}
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
