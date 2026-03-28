'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { DOCUMENT_TYPES } from '@/types'
import { Search, Loader2, X } from 'lucide-react'

const API_DEFAULT_LIMIT = 100

const glassPanel =
  'rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

interface AdminDocumentRow {
  id: string
  project_id: string
  doc_type: string
  title: string
  version: number
  generated_at: string
  projectName: string
}

function docTypeTitle(type: string) {
  return DOCUMENT_TYPES.find((d) => d.type === type)?.title ?? type
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [docType, setDocType] = useState('')

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('limit', String(API_DEFAULT_LIMIT))
    if (search) params.set('search', search)
    if (docType) params.set('docType', docType)
    const res = await fetch(`/api/admin/documents?${params}`)
    if (res.ok) setDocuments(await res.json())
    setLoading(false)
  }, [search, docType])

  useEffect(() => {
    const t = setTimeout(fetchDocs, 300)
    return () => clearTimeout(t)
  }, [fetchDocs])

  const activeFilterSummary = useMemo(() => {
    if (!search && !docType) return null
    const parts: string[] = []
    if (search) parts.push(`Search: "${search}"`)
    if (docType) parts.push(`Type: ${docTypeTitle(docType)}`)
    return parts.join(' · ')
  }, [search, docType])

  const thClass =
    'sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-md text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-white/45 border-b border-white/[0.08]'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Documents</h1>
        <p className="text-text-secondary mt-1 max-w-3xl">
          Read-only directory (newest first, up to{' '}
          <strong className="text-text-primary font-medium">{API_DEFAULT_LIMIT}</strong> per request).{' '}
          <strong className="text-text-primary font-medium">Titles and project names may be sensitive</strong>
          —treat as internal. Open a project from a row for full context.
        </p>
      </div>

      <div className={`${glassPanel} p-5 space-y-4`}>
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Filters</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search documents by title"
            />
          </div>
          <div className="w-full min-w-[200px] sm:w-[22rem] sm:max-w-[22rem] sm:flex-none">
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              aria-label="Filter by document type"
            >
              <option value="">All types</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.title}
                </option>
              ))}
            </Select>
          </div>
          {(search || docType) && (
            <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setDocType('') }}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
        {activeFilterSummary && (
          <p className="text-xs text-white/40 pt-1 border-t border-white/[0.06]">{activeFilterSummary}</p>
        )}
      </div>

      <div className={`${glassPanel} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40">
                  <th className={thClass}>Title</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Ver.</th>
                  <th className={thClass}>Generated</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-white/35 text-sm">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  documents.map((d, i) => (
                    <tr
                      key={d.id}
                      className={`border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.05] ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <td className="px-5 py-3 font-medium text-white max-w-[240px] truncate" title={d.title}>
                        {d.title}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="text-[10px] uppercase border-white/20 text-white/80">
                          {d.doc_type}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/projects/${d.project_id}`}
                          className="text-white font-medium hover:text-cyan-300/90 transition-colors truncate block max-w-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] rounded-sm"
                        >
                          {d.projectName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-white/55 tabular-nums">{d.version}</td>
                      <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap tabular-nums">
                        {formatDate(d.generated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
