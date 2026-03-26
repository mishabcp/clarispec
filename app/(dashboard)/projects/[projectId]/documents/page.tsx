'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { Button } from '@/components/ui/button'
import type { Document, Project } from '@/types'
import { ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react'
import { exportToMarkdown } from '@/lib/documents/exportMarkdown'

export default function DocumentsListPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [documents, setDocuments] = useState<Document[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadData() {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectData) setProject(projectData as Project)

      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: true })

      if (docsData) setDocuments(docsData as Document[])
      setLoading(false)
    }

    loadData()
  }, [projectId, supabase])

  async function handleExportAll() {
    setExporting(true)
    setExportDone(false)
    for (let i = 0; i < documents.length; i++) {
      exportToMarkdown(documents[i].title, documents[i].content)
      if (i < documents.length - 1) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }
    setExporting(false)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 2500)
  }

  if (loading) {
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
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Documents</h1>
          <p className="text-text-secondary mt-1">
            {project?.name} — {documents.length} documents generated
          </p>
        </div>
        {documents.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 min-w-[140px]"
            onClick={handleExportAll}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                Exported!
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export All
              </>
            )}
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-text-muted mb-4">No documents generated yet.</p>
          <Link href={`/projects/${projectId}/gather`}>
            <Button>Go to Requirements Gathering</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
