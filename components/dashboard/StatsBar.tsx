import { FolderOpen, Clock, CheckCircle2, FileText } from 'lucide-react'

interface StatsBarProps {
  totalProjects: number
  inProgress: number
  completed: number
  documentsGenerated: number
}

export function StatsBar({ totalProjects, inProgress, completed, documentsGenerated }: StatsBarProps) {
  const stats = [
    { label: 'Total Projects', value: totalProjects, icon: FolderOpen, color: 'text-primary' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-warning' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-success' },
    { label: 'Documents', value: documentsGenerated, icon: FileText, color: 'text-accent' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-surface p-4"
        >
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
  )
}
