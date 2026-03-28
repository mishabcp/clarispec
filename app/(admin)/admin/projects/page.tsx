'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { Search, Loader2, ArrowUpDown, X } from 'lucide-react'

const glassPanel =
  'rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]'

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

const thBase =
  'sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-md text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest text-white/45 border-b border-white/[0.08]'

function SortHeader({
  field,
  sortField,
  sortOrder,
  onToggleSort,
  children,
}: {
  field: string
  sortField: string
  sortOrder: 'asc' | 'desc'
  onToggleSort: (field: string) => void
  children: React.ReactNode
}) {
  const active = sortField === field
  const ariaSort = active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'

  function handleKeyDown(e: React.KeyboardEvent<HTMLTableCellElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleSort(field)
    }
  }

  return (
    <th
      scope="col"
      aria-sort={ariaSort as 'ascending' | 'descending' | 'none'}
      tabIndex={0}
      className={cn(
        thBase,
        'cursor-pointer hover:text-white/80 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]'
      )}
      onClick={() => onToggleSort(field)}
      onKeyDown={handleKeyDown}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn('h-3 w-3 shrink-0', active ? 'text-primary' : 'text-white/30')} aria-hidden />
      </span>
    </th>
  )
}

export default function AdminProjectsPage() {
  const router = useRouter()
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
    if (res.ok) {
      setProjects(await res.json())
    } else {
      setProjects([])
    }
    setLoading(false)
  }, [search, statusFilter, sortField, sortOrder, userIdFilter])

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [fetchProjects])

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  function clearFilters() {
    setStatusFilter('')
    router.replace('/admin/projects')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">All Projects</h1>
        <p className="text-text-secondary mt-1">
          {userIdFilter ? 'Filtered by user' : 'Browse and manage all projects across the platform'}
        </p>
      </div>

      <div className={`${glassPanel} p-5 space-y-4`}>
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Filters</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search projects by name, client, or industry"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['gathering', 'completed', 'archived'].map((s) => (
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
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={`${glassPanel} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-white/[0.08]">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Project directory</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <SortHeader field="name" sortField={sortField} sortOrder={sortOrder} onToggleSort={toggleSort}>
                    Name
                  </SortHeader>
                  <th scope="col" className={thBase}>
                    Owner
                  </th>
                  <th scope="col" className={cn(thBase, 'hidden sm:table-cell')}>
                    Industry
                  </th>
                  <SortHeader field="status" sortField={sortField} sortOrder={sortOrder} onToggleSort={toggleSort}>
                    Status
                  </SortHeader>
                  <SortHeader
                    field="requirement_score"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onToggleSort={toggleSort}
                  >
                    Score
                  </SortHeader>
                  <th scope="col" className={thBase}>
                    Msgs
                  </th>
                  <th scope="col" className={thBase}>
                    Docs
                  </th>
                  <SortHeader field="created_at" sortField={sortField} sortOrder={sortOrder} onToggleSort={toggleSort}>
                    Created
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-white/35 text-sm">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  projects.map((p, i) => (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.05]',
                        i % 2 === 1 && 'bg-white/[0.02]'
                      )}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/projects/${p.id}`}
                          className="text-white font-medium hover:text-cyan-300/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] rounded-sm"
                        >
                          {p.name}
                        </Link>
                        {p.client_name && <p className="text-xs text-white/40 mt-0.5">{p.client_name}</p>}
                      </td>
                      <td className="px-5 py-3 text-white/55">{p.owner?.full_name || 'Unknown'}</td>
                      <td className="hidden sm:table-cell px-5 py-3 text-white/45">{p.client_industry || '-'}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={statusVariants[p.status] || 'secondary'}
                          className="capitalize border-white/20 text-white/85"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-white tabular-nums">{p.requirement_score}%</td>
                      <td className="px-5 py-3 text-white/45 tabular-nums">{p.messageCount}</td>
                      <td className="px-5 py-3 text-white/45 tabular-nums">{p.documentCount}</td>
                      <td className="px-5 py-3 text-white/40 whitespace-nowrap tabular-nums">{formatDate(p.created_at)}</td>
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
