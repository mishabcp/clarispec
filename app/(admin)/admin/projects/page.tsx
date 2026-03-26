'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Search, Loader2, ArrowUpDown, X } from 'lucide-react'

interface AdminProject {
  id: string
  name: string
  client_name: string | null
  client_industry: string | null
  status: string
  depth_level: string
  requirement_score: number
  created_at: string
  owner: { id: string; full_name: string; company_name: string | null } | null
  messageCount: number
  documentCount: number
}

const statusVariants: Record<string, 'warning' | 'success' | 'secondary'> = {
  gathering: 'warning',
  completed: 'success',
  archived: 'secondary',
}

function SortHeader({
  field,
  sortField,
  onToggleSort,
  children,
}: {
  field: string
  sortField: string
  onToggleSort: (field: string) => void
  children: React.ReactNode
}) {
  return (
    <th
      className="text-left px-5 py-3 font-medium cursor-pointer hover:text-text-primary select-none"
      onClick={() => onToggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : ''}`} />
      </span>
    </th>
  )
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const searchParams = useSearchParams()
  const userIdFilter = searchParams.get('userId')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (userIdFilter) params.set('userId', userIdFilter)
    params.set('sort', sortField)
    params.set('order', sortOrder)

    const res = await fetch(`/api/admin/projects?${params}`)
    if (res.ok) setProjects(await res.json())
    setLoading(false)
  }, [search, statusFilter, sortField, sortOrder, userIdFilter])

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [fetchProjects])

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">All Projects</h1>
        <p className="text-text-secondary mt-1">
          {userIdFilter ? 'Filtered by user' : 'Browse and manage all projects across the platform'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {['gathering', 'completed', 'archived'].map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'ghost'}
            className="capitalize"
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
          >
            {s}
          </Button>
        ))}
        {(statusFilter || userIdFilter) && (
          <Button size="sm" variant="ghost" onClick={() => { setStatusFilter(''); window.history.replaceState(null, '', '/admin/projects') }}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <SortHeader field="name" sortField={sortField} onToggleSort={toggleSort}>Name</SortHeader>
                  <th className="text-left px-5 py-3 font-medium">Owner</th>
                  <th className="text-left px-5 py-3 font-medium">Industry</th>
                  <SortHeader field="status" sortField={sortField} onToggleSort={toggleSort}>Status</SortHeader>
                  <SortHeader field="requirement_score" sortField={sortField} onToggleSort={toggleSort}>Score</SortHeader>
                  <th className="text-left px-5 py-3 font-medium">Msgs</th>
                  <th className="text-left px-5 py-3 font-medium">Docs</th>
                  <SortHeader field="created_at" sortField={sortField} onToggleSort={toggleSort}>Created</SortHeader>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-text-muted">
                      No projects found
                    </td>
                  </tr>
                ) : projects.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/projects/${p.id}`} className="text-text-primary hover:text-primary font-medium">
                        {p.name}
                      </Link>
                      {p.client_name && <p className="text-xs text-text-muted">{p.client_name}</p>}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{p.owner?.full_name || 'Unknown'}</td>
                    <td className="px-5 py-3 text-text-muted">{p.client_industry || '-'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariants[p.status] || 'secondary'} className="capitalize">{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium">{p.requirement_score}%</td>
                    <td className="px-5 py-3 text-text-muted">{p.messageCount}</td>
                    <td className="px-5 py-3 text-text-muted">{p.documentCount}</td>
                    <td className="px-5 py-3 text-text-muted">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
