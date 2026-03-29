'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { Document, Project, RequirementArea } from '@/types'

function ChartsLoadingSkeleton() {
  return (
    <section aria-label="Loading charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="min-h-[280px] rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-5 animate-pulse"
        >
          <div className="h-3 w-24 bg-white/[0.06] rounded-sm mb-2" />
          <div className="h-2 w-40 bg-white/[0.04] rounded-sm mb-6" />
          <div className="min-h-[220px] rounded-sm bg-white/[0.03]" />
        </div>
      ))}
    </section>
  )
}

function WidgetsLoadingSkeleton() {
  return (
    <div className="mb-12 grid gap-6 md:grid-cols-2 min-h-[200px] rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/20 animate-pulse" />
  )
}

const DashboardCharts = dynamic(
  () => import('@/components/dashboard/DashboardCharts').then((m) => m.DashboardCharts),
  { ssr: false, loading: () => <ChartsLoadingSkeleton /> }
)

const DashboardWidgets = dynamic(
  () => import('@/components/dashboard/DashboardWidgets').then((m) => m.DashboardWidgets),
  { ssr: false, loading: () => <WidgetsLoadingSkeleton /> }
)

export type DeferredDashboardChartsProps = ComponentProps<typeof DashboardCharts>

export function DeferredDashboardCharts(props: DeferredDashboardChartsProps) {
  return <DashboardCharts {...props} />
}

export type DeferredDashboardWidgetsProps = {
  projects: Project[]
  documents: (Document & { projectName: string })[]
  areas: RequirementArea[]
}

export function DeferredDashboardWidgets(props: DeferredDashboardWidgetsProps) {
  return <DashboardWidgets {...props} />
}
