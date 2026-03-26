'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Users,
  FolderOpen,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Bot,
  BarChart3,
  Loader2,
} from 'lucide-react'

interface Stats {
  totalUsers: number
  totalProjects: number
  statusCounts: { gathering: number; completed: number; archived: number }
  totalMessages: number
  aiMessages: number
  userMessages: number
  totalDocuments: number
  avgScore: number
  recentProjects: Array<{
    id: string
    name: string
    client_name: string | null
    status: string
    requirement_score: number
    created_at: string
    ownerName: string
  }>
  dailyProjectCounts: Record<string, number>
}

const statusVariants: Record<string, 'warning' | 'success' | 'secondary'> = {
  gathering: 'warning',
  completed: 'success',
  archived: 'secondary',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-accent' },
    { label: 'In Progress', value: stats.statusCounts.gathering, icon: Clock, color: 'text-warning' },
    { label: 'Completed', value: stats.statusCounts.completed, icon: CheckCircle2, color: 'text-success' },
    { label: 'Documents', value: stats.totalDocuments, icon: FileText, color: 'text-primary' },
    { label: 'AI Responses', value: stats.aiMessages, icon: Bot, color: 'text-accent' },
    { label: 'User Messages', value: stats.userMessages, icon: MessageSquare, color: 'text-warning' },
    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: BarChart3, color: 'text-success' },
  ]

  const dailyEntries = Object.entries(stats.dailyProjectCounts)
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">System-wide overview and statistics</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-surface-hover p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projects per day chart */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Projects Created (Last 30 Days)</h3>
          <div className="flex items-end gap-[2px] h-32">
            {dailyEntries.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full bg-primary/60 rounded-t transition-colors group-hover:bg-primary"
                  style={{ height: `${(count / maxDaily) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-surface-hover border border-border rounded px-2 py-1 text-xs text-text-primary whitespace-nowrap z-10">
                  {day}: {count}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-text-muted">
            <span>{dailyEntries[0]?.[0]?.slice(5)}</span>
            <span>{dailyEntries[dailyEntries.length - 1]?.[0]?.slice(5)}</span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Projects by Status</h3>
          <div className="space-y-4">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const pct = stats.totalProjects > 0 ? Math.round((count / stats.totalProjects) * 100) : 0
              const colors: Record<string, string> = {
                gathering: 'bg-warning',
                completed: 'bg-success',
                archived: 'bg-text-muted',
              }
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary capitalize">{status}</span>
                    <span className="text-sm font-medium text-text-primary">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                    <div className={`h-full rounded-full ${colors[status] || 'bg-primary'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-xs font-medium text-text-muted mb-2">AI Usage Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-muted text-xs">Total Interactions</p>
                <p className="font-semibold">{stats.totalMessages.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Avg per Project</p>
                <p className="font-semibold">
                  {stats.totalProjects > 0 ? Math.round(stats.totalMessages / stats.totalProjects) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent projects table */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Recent Projects</h3>
          <Link href="/admin/projects" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Owner</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Score</th>
                <th className="text-left px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProjects.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/projects/${p.id}`} className="text-text-primary hover:text-primary font-medium">
                      {p.name}
                    </Link>
                    {p.client_name && <p className="text-xs text-text-muted">{p.client_name}</p>}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{p.ownerName}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariants[p.status] || 'secondary'} className="capitalize">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-text-primary font-medium">{p.requirement_score}%</td>
                  <td className="px-5 py-3 text-text-muted">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
