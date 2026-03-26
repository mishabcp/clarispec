import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types'
import { ArrowRight, FileText } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  documentCount: number
}

const statusConfig = {
  gathering: { label: 'Gathering', variant: 'warning' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  archived: { label: 'Archived', variant: 'secondary' as const },
}

export function ProjectCard({ project, documentCount }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold font-heading text-text-primary truncate">
            {project.name}
          </h3>
          {project.client_name && (
            <p className="text-sm text-text-secondary mt-0.5">{project.client_name}</p>
          )}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {project.client_industry && (
        <Badge variant="outline" className="mt-3">
          {project.client_industry}
        </Badge>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Requirements</span>
          <span>{project.requirement_score}%</span>
        </div>
        <Progress
          value={project.requirement_score}
          indicatorClassName={
            project.requirement_score >= 70
              ? 'bg-success'
              : project.requirement_score >= 40
              ? 'bg-warning'
              : 'bg-danger'
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {documentCount} docs
          </span>
          <span>{formatDate(project.created_at)}</span>
        </div>
        <Link href={`/projects/${project.id}`}>
          <Button size="sm" variant="ghost" className="gap-1">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
