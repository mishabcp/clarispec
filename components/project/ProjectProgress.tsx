'use client'

import { cn } from '@/lib/utils'
import type { RequirementArea } from '@/types'
import { REQUIREMENT_AREA_LABELS } from '@/types'
import { CheckCircle2, Circle } from 'lucide-react'

interface ProjectProgressProps {
  score: number
  areas: RequirementArea[]
}

export function ProjectProgress({ score, areas }: ProjectProgressProps) {
  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger'
  const strokeColor = score >= 70 ? 'stroke-success' : score >= 40 ? 'stroke-warning' : 'stroke-danger'

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="space-y-6">
      {/* Circular progress */}
      <div className="flex flex-col items-center">
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              className="stroke-surface-hover"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={cn('transition-all duration-1000 ease-out', strokeColor)}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold font-heading', scoreColor)}>
              {score}%
            </span>
            <span className="text-xs text-text-muted">Complete</span>
          </div>
        </div>
      </div>

      {/* Requirement areas checklist */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Requirement Areas
        </h4>
        <div className="space-y-1.5">
          {areas.map((area) => {
            const areaKey = area.area_name as keyof typeof REQUIREMENT_AREA_LABELS
            const label = REQUIREMENT_AREA_LABELS[areaKey]?.label || area.area_name
            return (
              <div
                key={area.id}
                className="flex items-center gap-2 text-sm"
              >
                {area.is_covered ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-text-muted shrink-0" />
                )}
                <span className={area.is_covered ? 'text-text-primary' : 'text-text-muted'}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
