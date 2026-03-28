'use client'

import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface DashboardChartStatusItem {
  name: string
  value: number
}

export interface DashboardChartMonthlyItem {
  label: string
  count: number
}

export interface DashboardChartScoreBucket {
  range: string
  count: number
}

interface DashboardChartsProps {
  statusData: DashboardChartStatusItem[]
  monthlyData: DashboardChartMonthlyItem[]
  scoreBuckets: DashboardChartScoreBucket[]
  hasProjects: boolean
}

const STATUS_COLORS: Record<string, string> = {
  Gathering: '#22d3ee',
  Completed: '#a3e635',
  Archived: '#c4b5fd',
}

const BAR_FILL = 'rgba(255, 255, 255, 0.55)'
const AXIS_TICK = 'rgba(255, 255, 255, 0.45)'
const GRID_STROKE = 'rgba(255, 255, 255, 0.08)'

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/40 backdrop-blur-[64px] p-5 min-h-[280px]">
      <div className="mb-1">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">{title}</h3>
        <p className="text-[9px] text-white/35 mt-1 uppercase tracking-widest">{description}</p>
      </div>
      <div className="flex-1 w-full min-h-[220px] mt-2">{children}</div>
    </div>
  )
}

function TooltipBox({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div
      className="rounded-[1px] border border-white/[0.12] bg-[#0a0a0b] px-3 py-2 text-xs text-white shadow-xl"
      role="status"
    >
      <span className="text-white/50">{label}</span>
      <span className="ml-2 font-medium tabular-nums text-white">
        {value} {suffix}
      </span>
    </div>
  )
}

export function DashboardCharts({
  statusData,
  monthlyData,
  scoreBuckets,
  hasProjects,
}: DashboardChartsProps) {
  const statusTotal = statusData.reduce((a, d) => a + d.value, 0)
  const monthlyMax = Math.max(1, ...monthlyData.map((d) => d.count))
  const scoreMax = Math.max(1, ...scoreBuckets.map((d) => d.count))

  const pieData = statusData.filter((d) => d.value > 0)

  return (
    <section aria-label="Dashboard charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <ChartCard
        title="Project status"
        description="Gathering vs completed vs archived"
      >
        {!hasProjects || statusTotal === 0 ? (
          <div className="h-full min-h-[220px] flex items-center justify-center text-center px-4">
            <p className="text-xs text-white/40 font-light">No projects yet — status breakdown will appear here.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
                    stroke="rgba(0,0,0,0.35)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const p = payload[0] as { name?: string; value?: number }
                  const v = Number(p.value ?? 0)
                  const n = String(p.name ?? '')
                  return <TooltipBox label={n} value={v} suffix={v === 1 ? 'project' : 'projects'} />
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        {hasProjects && statusTotal > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center text-[9px] uppercase tracking-widest text-white/50">
            {statusData.map((d) => (
              <li key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-sm shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[d.name] ?? '#94a3b8' }}
                  aria-hidden
                />
                {d.name}: <span className="text-white/80 tabular-nums">{d.value}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>

      <ChartCard
        title="New projects"
        description="Created in the last 6 months"
      >
        {!hasProjects ? (
          <div className="h-full min-h-[220px] flex items-center justify-center text-center px-4">
            <p className="text-xs text-white/40 font-light">Create a project to see activity by month.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: GRID_STROKE }}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fill: AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={[0, monthlyMax]}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.[0]) return null
                  const v = Number((payload[0] as { value?: number }).value ?? 0)
                  return <TooltipBox label={String(label ?? '')} value={v} suffix={v === 1 ? 'project' : 'projects'} />
                }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={BAR_FILL} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Requirement scores"
        description="Distribution across your projects"
      >
        {!hasProjects ? (
          <div className="h-full min-h-[220px] flex items-center justify-center text-center px-4">
            <p className="text-xs text-white/40 font-light">Scores will chart here once you have projects.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={scoreBuckets}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: GRID_STROKE }}
                domain={[0, scoreMax]}
              />
              <YAxis
                type="category"
                dataKey="range"
                width={44}
                tick={{ fill: AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const row = payload[0] as { value?: number; payload?: { range?: string } }
                  const v = Number(row.value ?? 0)
                  const lbl = row.payload?.range ?? 'Range'
                  return <TooltipBox label={lbl} value={v} suffix={v === 1 ? 'project' : 'projects'} />
                }}
              />
              <Bar dataKey="count" radius={[0, 2, 2, 0]} fill={BAR_FILL} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </section>
  )
}
