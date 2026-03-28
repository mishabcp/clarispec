'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DOCUMENT_TYPES } from '@/types'
import { Loader2, X, Search, Check, Minus } from 'lucide-react'

const API_DEFAULT_LIMIT = 1000

const glassPanel =
  'rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

interface AdminSelectionRow {
  id: string
  project_id: string
  doc_type: string
  is_selected: boolean
  projectName: string
}

const DOC_TITLE: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.type, d.title])
)

export default function AdminDocumentSelectionsPage() {
  const [rows, setRows] = useState<AdminSelectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'selected' | 'unselected'>('all')
  const [projectQuery, setProjectQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('limit', String(API_DEFAULT_LIMIT))
    fetch(`/api/admin/document-selections?${params}`)
      .then(async (res) => {
        if (cancelled) return
        if (res.ok) setRows(await res.json())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const projectScoped = useMemo(() => {
    const q = projectQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.projectName.toLowerCase().includes(q) ||
        r.project_id.toLowerCase().includes(q)
    )
  }, [rows, projectQuery])

  const filtered = useMemo(() => {
    if (filter === 'all') return projectScoped
    if (filter === 'selected') return projectScoped.filter((r) => r.is_selected)
    return projectScoped.filter((r) => !r.is_selected)
  }, [projectScoped, filter])

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = []
    if (projectQuery.trim()) parts.push(`Project contains "${projectQuery.trim()}"`)
    if (filter === 'selected') parts.push('Selection: Yes only')
    if (filter === 'unselected') parts.push('Selection: No only')
    if (parts.length === 0) return null
    return parts.join(' · ')
  }, [projectQuery, filter])

  const thClass =
    'sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-md text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-white/45 border-b border-white/[0.08]'

  const hasActiveFilters = filter !== 'all' || projectQuery.trim().length > 0

  function clearFilters() {
    setFilter('all')
    setProjectQuery('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Doc selections</h1>
        <p className="text-text-secondary mt-1 max-w-3xl">
          Per-project choices for which document types to generate (setup / gather). Read-only. Up to{' '}
          <strong className="text-text-primary font-medium">{API_DEFAULT_LIMIT}</strong> rows per load; search and
          toggles below filter in the browser.
        </p>
      </div>

      <div className={`${glassPanel} p-5 space-y-4`}>
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Filters</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <Input
              placeholder="Filter by project name or ID…"
              value={projectQuery}
              onChange={(e) => setProjectQuery(e.target.value)}
              className="pl-9"
              aria-label="Filter rows by project name or project ID"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'selected', 'unselected'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'ghost'}
                className="capitalize"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All rows' : f}
              </Button>
            ))}
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear filters
              </Button>
            )}
          </div>
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
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Document type</th>
                  <th className={thClass}>Selected</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-white/35 text-sm">
                      No rows match this filter
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.05] ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/projects/${r.project_id}`}
                          className="text-white font-medium hover:text-cyan-300/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] rounded-sm"
                        >
                          {r.projectName}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-white">{DOC_TITLE[r.doc_type] ?? r.doc_type}</span>
                        <span className="text-white/40 text-xs ml-2 font-mono">({r.doc_type})</span>
                      </td>
                      <td className="px-5 py-3">
                        {r.is_selected ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
                            <Minus className="h-3.5 w-3.5 shrink-0 text-white/45" aria-hidden />
                            No
                          </span>
                        )}
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
