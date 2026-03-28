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

export interface AdminStatsForCharts {
  totalProjects: number
  statusCounts: { gathering: number; completed: number; archived: number }
  dailyProjectCounts: Record<string, number>
  dailyDocumentCounts: Record<string, number>
  dailyMessageCounts: Record<string, number>
  scoreBuckets: { range: string; count: number }[]
  documentsByType: { type: string; count: number }[]
  depthLevelCounts: { quick: number; standard: number; deep: number }
}

const STATUS_COLORS: Record<string, string> = {
  Gathering: '#22d3ee',
  Completed: '#a3e635',
  Archived: '#c4b5fd',
}

const BAR_FILL = 'rgba(255, 255, 255, 0.5)'
const BAR_FILL_DOC = 'rgba(34, 211, 238, 0.45)'
const BAR_FILL_MSG = 'rgba(196, 181, 253, 0.45)'
const AXIS_TICK = 'rgba(255, 255, 255, 0.45)'
const GRID_STROKE = 'rgba(255, 255, 255, 0.08)'

function recordToSortedSeries(r: Record<string, number>): { label: string; count: number }[] {
  return Object.entries(r)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ label: date.slice(5), count }))
}

function ChartShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-[1px] border border-white/[0.08] bg-[#0a0a0b]/50 backdrop-blur-[64px] p-5 min-h-[300px]">
      <div className="mb-2">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">{title}</h3>
        <p className="text-[9px] text-white/35 mt-1 uppercase tracking-widest">{description}</p>
      </div>
      <div className="flex-1 w-full min-h-[220px] mt-1">{children}</div>
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
      <span className="ml-2 font-medium tabular-nums">
        {value} {suffix}
      </span>
    </div>
  )
}

export function AdminDashboardCharts({ stats }: { stats: AdminStatsForCharts }) {
  const statusData = [
    { name: 'Gathering', value: stats.statusCounts.gathering },
    { name: 'Completed', value: stats.statusCounts.completed },
    { name: 'Archived', value: stats.statusCounts.archived },
  ]
  const statusTotal = statusData.reduce((a, d) => a + d.value, 0)
  const pieData = statusData.filter((d) => d.value > 0)

  const projectSeries = recordToSortedSeries(stats.dailyProjectCounts)
  const docSeries = recordToSortedSeries(stats.dailyDocumentCounts)
  const msgSeries = recordToSortedSeries(stats.dailyMessageCounts)

  const projectMax = Math.max(1, ...projectSeries.map((d) => d.count))
  const docMax = Math.max(1, ...docSeries.map((d) => d.count))
  const msgMax = Math.max(1, ...msgSeries.map((d) => d.count))
  const scoreMax = Math.max(1, ...stats.scoreBuckets.map((d) => d.count))
  const typeMax = Math.max(1, ...stats.documentsByType.map((d) => d.count))

  const depthData = [
    { name: 'Quick', count: stats.depthLevelCounts.quick },
    { name: 'Standard', count: stats.depthLevelCounts.standard },
    { name: 'Deep', count: stats.depthLevelCounts.deep },
  ]
  const depthMax = Math.max(1, ...depthData.map((d) => d.count))

  const topDocTypes = stats.documentsByType.slice(0, 8)

  return (
    <section aria-label="Admin analytics" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      <ChartShell title="Project status" description="Share of all projects by lifecycle">
        {statusTotal === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-white/40">No projects yet</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={76}
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
            <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[9px] uppercase tracking-widest text-white/50 mt-1">
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
          </>
        )}
      </ChartShell>

      <ChartShell title="New projects" description="Created per day · last 30 days">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projectSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: AXIS_TICK, fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: GRID_STROKE }}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: AXIS_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, projectMax]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null
                const v = Number((payload[0] as { value?: number }).value ?? 0)
                return <TooltipBox label={String(label ?? '')} value={v} suffix={v === 1 ? 'project' : 'projects'} />
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={BAR_FILL} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Documents generated" description="By generated date · last 30 days">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={docSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: AXIS_TICK, fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: GRID_STROKE }}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: AXIS_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, docMax]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null
                const v = Number((payload[0] as { value?: number }).value ?? 0)
                return <TooltipBox label={String(label ?? '')} value={v} suffix={v === 1 ? 'doc' : 'docs'} />
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={BAR_FILL_DOC} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Messages" description="Created per day · last 30 days">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={msgSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: AXIS_TICK, fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: GRID_STROKE }}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: AXIS_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, msgMax]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null
                const v = Number((payload[0] as { value?: number }).value ?? 0)
                return <TooltipBox label={String(label ?? '')} value={v} suffix={v === 1 ? 'message' : 'messages'} />
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={BAR_FILL_MSG} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Requirement scores" description="Project count by score band">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={stats.scoreBuckets}
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
              width={48}
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
                const lbl = row.payload?.range ?? 'Band'
                return <TooltipBox label={lbl} value={v} suffix={v === 1 ? 'project' : 'projects'} />
              }}
            />
            <Bar dataKey="count" radius={[0, 2, 2, 0]} fill={BAR_FILL} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Document types" description="Generated documents by type">
        {topDocTypes.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-white/40">No documents yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topDocTypes} layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: GRID_STROKE }}
                domain={[0, typeMax]}
              />
              <YAxis
                type="category"
                dataKey="type"
                width={120}
                tick={{ fill: AXIS_TICK, fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const row = payload[0] as { value?: number; payload?: { type?: string } }
                  const v = Number(row.value ?? 0)
                  const lbl = row.payload?.type ?? ''
                  return <TooltipBox label={lbl} value={v} suffix={v === 1 ? 'document' : 'documents'} />
                }}
              />
              <Bar dataKey="count" radius={[0, 2, 2, 0]} fill="rgba(163, 230, 53, 0.5)" maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      <ChartShell title="Depth level" description="Projects by discovery depth">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={depthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: AXIS_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: GRID_STROKE }}
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: AXIS_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, depthMax]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null
                const v = Number((payload[0] as { value?: number }).value ?? 0)
                return <TooltipBox label={String(label ?? '')} value={v} suffix={v === 1 ? 'project' : 'projects'} />
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} fill="rgba(255,255,255,0.42)" maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </section>
  )
}
