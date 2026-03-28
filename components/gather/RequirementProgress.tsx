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
      <div className="border-b border-white/[0.08] px-3 py-2">
        <h2 className="text-[13px] font-bold font-heading text-white tracking-widest uppercase truncate">{projectName}</h2>
        {clientName && <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider">{clientName}</p>}
        <Badge variant="outline" className="mt-1.5 h-5 px-2 text-[9px] uppercase font-bold tracking-[0.2em] bg-white/[0.03] border-white/[0.1] rounded-none">
          {depthLabels[depthLevel]}
        </Badge>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center p-2">
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="5"
              className="stroke-white/[0.03]"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className={cn('transition-all duration-1000 ease-out', strokeColor)}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-xl font-bold font-heading', scoreColor)}>
              {score}%
            </span>
            <span className="text-[9px] uppercase tracking-widest text-white/30">Progress</span>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] uppercase tracking-widest text-white/35">
          Min. {threshold}% Target
        </p>
      </div>

      {/* Areas checklist */}
      <div className="flex-1 overflow-y-auto border-t border-white/[0.08] px-3 py-2 scrollbar-thin">
        <h4 className="mb-1.5 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
          Coverage Logic
        </h4>
        <div className="space-y-1">
          {(Object.entries(areas) as [keyof RequirementAreas, boolean][]).map(([key, covered]) => {
            const label = REQUIREMENT_AREA_LABELS[key]?.label || key
            return (
              <div key={key} className="flex items-center gap-2 text-[11px] font-light tracking-wide">
                {covered ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-white/15 shrink-0" />
                )}
                <span className={covered ? 'text-white font-medium' : 'text-white/45'}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Generate button */}
      <div className="border-t border-border px-3 py-2">
        {canGenerate && !generating && (
          <div className="mb-1.5 flex items-center gap-2 rounded-none bg-success/10 px-2.5 py-1.5 animate-pulse">
            <Sparkles className="h-3 w-3 text-success" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-success">Ready to generate!</span>
          </div>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || generating}
          className={cn(
            "w-full h-10 gap-2 rounded-none transition-all duration-500 font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl",
            canGenerate && !generating
              ? "bg-white text-black hover:bg-white/90 shadow-[0_4px_24px_rgba(255,255,255,0.1)]"
              : "bg-white/[0.05] text-white/35 border border-white/[0.08] cursor-not-allowed"
          )}
        >
          {generating ? (
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          {generating ? 'Processing System...' : 'Generate Documents'}
        </Button>
        {!canGenerate && (
          <p className="mt-1.5 text-center text-[10px] uppercase tracking-widest text-white/35">
            Reach {threshold}% completeness to generate
          </p>
        )}
      </div>
    </div>
  )
}
