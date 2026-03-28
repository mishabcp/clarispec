'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts'
import {
  Users,
  FolderOpen,
  Clock,
  CheckCircle2,
  Archive,
  FileText,
  MessageSquare,
  Bot,
  BarChart3,
  Loader2,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  dailyDocumentCounts?: Record<string, number>
  dailyMessageCounts?: Record<string, number>
  documentsByType?: { type: string; count: number }[]
  depthLevelCounts?: { quick: number; standard: number; deep: number }
  scoreBuckets?: { range: string; count: number }[]
  error?: string
}

const statusVariants: Record<string, 'warning' | 'success' | 'secondary'> = {
  gathering: 'warning',
  completed: 'success',
  archived: 'secondary',
}

function StatTile({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string
  value: string | number
  icon: typeof Users
  iconClass: string
}) {
  return (
    <div className="group relative rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-5 overflow-hidden hover:border-white/[0.14] transition-colors duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="flex flex-col gap-3 relative z-10">
        <div
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-none bg-white/[0.05] border border-white/[0.1]',
            iconClass
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-extralight font-heading text-white tabular-nums">{value}</p>
          <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 mt-1">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/stats')
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setLoadError(data.error || 'Failed to load statistics')
          setStats(null)
          return
        }
        setLoadError(null)
        setStats(data as Stats)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Network error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

  if (loadError || !stats || stats.error) {
    return (
      <div className="rounded-[1px] border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-red-400 text-sm font-medium">{loadError || stats?.error || 'Unable to load dashboard'}</p>
        <Link href="/admin/login" className="text-xs text-white/50 hover:text-white mt-4 inline-block underline">
          Return to login
        </Link>
      </div>
    )
  }

  const tp = stats.totalProjects
  const td = stats.totalDocuments
  const tm = stats.totalMessages

  const chartPayload = {
    totalProjects: tp,
    statusCounts: stats.statusCounts,
    dailyProjectCounts: stats.dailyProjectCounts,
    dailyDocumentCounts: stats.dailyDocumentCounts ?? {},
    dailyMessageCounts: stats.dailyMessageCounts ?? {},
    scoreBuckets: stats.scoreBuckets ?? [
      { range: '0–25', count: 0 },
      { range: '26–50', count: 0 },
      { range: '51–75', count: 0 },
      { range: '76–100', count: 0 },
    ],
    documentsByType: stats.documentsByType ?? [],
    depthLevelCounts: stats.depthLevelCounts ?? { quick: 0, standard: 0, deep: 0 },
  }

  const statTiles = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, iconClass: 'text-white' },
    { label: 'Total projects', value: tp, icon: FolderOpen, iconClass: 'text-white/90' },
    { label: 'In progress', value: stats.statusCounts.gathering, icon: Clock, iconClass: 'text-amber-400' },
    { label: 'Completed', value: stats.statusCounts.completed, icon: CheckCircle2, iconClass: 'text-emerald-400' },
    { label: 'Archived', value: stats.statusCounts.archived, icon: Archive, iconClass: 'text-white/50' },
    { label: 'Documents', value: td, icon: FileText, iconClass: 'text-cyan-400/90' },
    { label: 'Total messages', value: tm, icon: MessageSquare, iconClass: 'text-violet-300/90' },
    { label: 'AI responses', value: stats.aiMessages, icon: Bot, iconClass: 'text-cyan-300/80' },
    { label: 'User messages', value: stats.userMessages, icon: MessageSquare, iconClass: 'text-white/60' },
    { label: 'Avg score', value: `${stats.avgScore}%`, icon: BarChart3, iconClass: 'text-emerald-300/90' },
    {
      label: 'Avg docs / project',
      value: tp > 0 ? (td / tp).toFixed(1) : '0',
      icon: TrendingUp,
      iconClass: 'text-white/70',
    },
    {
      label: 'Avg msgs / project',
      value: tp > 0 ? (tm / tp).toFixed(1) : '0',
      icon: LayoutDashboard,
      iconClass: 'text-white/70',
    },
  ]

  return (
    <div className="space-y-10">
      <div className="rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] px-6 py-8 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-none border border-white/[0.1] bg-white/[0.05]">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] border-red-500/30 text-red-400/90">
            Admin
          </Badge>
        </div>
        <h1 className="text-2xl font-light font-heading text-white tracking-tight">Operations overview</h1>
        <p className="text-sm text-white/45 mt-2 max-w-2xl font-light leading-relaxed">
          System-wide metrics and trends. All figures are read-only aggregates across profiles, projects, messages, and
          documents.
        </p>
      </div>

      <div>
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 mb-4">Key metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {statTiles.map((s) => (
            <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} iconClass={s.iconClass} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 mb-4">Analytics</h2>
        <AdminDashboardCharts stats={chartPayload} />
      </div>

      <div className="rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Recent projects</h3>
          <Link href="/admin/projects" className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/40">
                <th className="text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest">Name</th>
                <th className="text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest">Owner</th>
                <th className="text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest">Score</th>
                <th className="text-left px-5 py-3 font-bold text-[9px] uppercase tracking-widest">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-white/35 text-sm">
                    No projects yet
                  </td>
                </tr>
              ) : (
                stats.recentProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="text-white font-medium hover:text-cyan-300/90 transition-colors"
                      >
                        {p.name}
                      </Link>
                      {p.client_name && <p className="text-xs text-white/35 mt-0.5">{p.client_name}</p>}
                    </td>
                    <td className="px-5 py-3 text-white/55">{p.ownerName}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariants[p.status] || 'secondary'} className="capitalize text-[10px]">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="text-white tabular-nums px-5 py-3">{p.requirement_score}%</td>
                    <td className="px-5 py-3 text-white/40 text-xs">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
