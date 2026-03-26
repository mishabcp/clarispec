'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RequirementAreas, DepthLevel } from '@/types'
import { REQUIREMENT_AREA_LABELS, DEPTH_THRESHOLDS } from '@/types'
import { CheckCircle2, Circle, FileText, Sparkles } from 'lucide-react'

interface RequirementProgressProps {
  projectName: string
  clientName?: string | null
  score: number
  areas: RequirementAreas
  depthLevel: DepthLevel
  onGenerate: () => void
  generating: boolean
}

export function RequirementProgress({
  projectName,
  clientName,
  score,
  areas,
  depthLevel,
  onGenerate,
  generating,
}: RequirementProgressProps) {
  const threshold = DEPTH_THRESHOLDS[depthLevel]
  const canGenerate = score >= threshold

  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger'
  const strokeColor = score >= 70 ? 'stroke-success' : score >= 40 ? 'stroke-warning' : 'stroke-danger'

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (score / 100) * circumference

  const depthLabels: Record<DepthLevel, string> = {
    quick: 'Quick Scan',
    standard: 'Standard',
    deep: 'Deep Dive',
  }

  return (
    <div className="flex h-full flex-col">
      {/* Project info */}
      <div className="border-b border-border p-4">
        <h2 className="font-semibold font-heading text-text-primary truncate">{projectName}</h2>
        {clientName && <p className="text-sm text-text-secondary mt-0.5">{clientName}</p>}
        <Badge variant="outline" className="mt-2">
          {depthLabels[depthLevel]}
        </Badge>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center p-6">
        <div className="relative h-28 w-28">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
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
            <span className={cn('text-2xl font-bold font-heading', scoreColor)}>
              {score}%
            </span>
            <span className="text-[10px] text-text-muted">Complete</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Min. {threshold}% to generate
        </p>
      </div>

      {/* Areas checklist */}
      <div className="flex-1 overflow-y-auto border-t border-border p-4 scrollbar-thin">
        <h4 className="mb-3 text-xs font-medium text-text-muted uppercase tracking-wider">
          Requirement Areas
        </h4>
        <div className="space-y-2">
          {(Object.entries(areas) as [keyof RequirementAreas, boolean][]).map(([key, covered]) => {
            const label = REQUIREMENT_AREA_LABELS[key]?.label || key
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                {covered ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-text-muted shrink-0" />
                )}
                <span className={covered ? 'text-text-primary' : 'text-text-muted'}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Generate button */}
      <div className="border-t border-border p-4">
        {canGenerate && !generating && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 animate-pulse">
            <Sparkles className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-success">Ready to generate!</span>
          </div>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || generating}
          className="w-full gap-2"
        >
          {generating ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {generating ? 'Generating...' : 'Generate Documents'}
        </Button>
        {!canGenerate && (
          <p className="mt-2 text-center text-xs text-text-muted">
            Reach {threshold}% completeness to generate
          </p>
        )}
      </div>
    </div>
  )
}
